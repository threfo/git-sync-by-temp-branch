import path from 'path'
import chalk from 'chalk'
import { execaCommandSync } from 'execa'
import isGitDirty from 'is-git-dirty'
import {
  ensureSyncDir,
  checkoutOrigin,
  checkoutSync,
  removeSyncGitOldFile,
  copyFile,
  gitAdd,
  gitCommit,
  gitPush,
  gitMerge,
  getParamsByPropsOrArgs,
  getCommitMsg,
} from './utils.js'

const passFileNames = ['.git', '.github', '.husky']

async function checkOutFileToTempAndCopySyncFileToTemp({
  targetBranch, // 目标仓库的分支
  commitBeforeCommand,
  tempBranch = '', // 临时分支
  originGitFilePath,
  syncGitFilePath,
}) {
  // 1
  console.log(chalk.bold(chalk.bgYellow(`删除${originGitFilePath}的文件`)))
  removeSyncGitOldFile(originGitFilePath, passFileNames)
  console.log(chalk.bold(chalk.bgBlue(`从${syncGitFilePath}复制文件到${originGitFilePath}`)))
  copyFile(syncGitFilePath, originGitFilePath, passFileNames)
  if (Array.isArray(commitBeforeCommand)) {
    commitBeforeCommand.forEach((command) => {
      execaCommandSync(command, { stdio: 'inherit', cwd: syncGitFilePath })
    })
  }
  if (isGitDirty(originGitFilePath)) {
    console.log(chalk.bold(chalk.green(`${targetBranch} 代码已同步到 ${tempBranch}`)))
    await gitAdd(originGitFilePath)
    const commitMsg = `chore: sync ${targetBranch} to ${tempBranch}`
    console.log(chalk.bold(chalk.green(`${originGitFilePath} commit ${commitMsg}`)))
    await gitCommit(originGitFilePath, commitMsg)
  } else {
    console.log(chalk.bold(chalk.green(`${targetBranch} 和 ${tempBranch} 一致`)))
  }
}

async function mergeAfter({
  targetBranch, // 目标仓库的分支
  commitBeforeCommand,
  tempBranch = '', // 临时分支
  commitMsg = 'chore: sync', // commit message
  originGitFilePath,
  syncGitFilePath,
  fromBranch,
}) {
  const newCommitMsg = await getCommitMsg(
    originGitFilePath,
    syncGitFilePath,
    `${commitMsg} ${fromBranch} to ${targetBranch}`,
  )
  // console.log(chalk.bold(chalk.red(`${newCommitMsg}`)))

  console.log(chalk.bold(chalk.bgYellow(`删除${syncGitFilePath}的文件`)))
  removeSyncGitOldFile(syncGitFilePath, passFileNames)
  console.log(chalk.bold(chalk.bgBlue(`从${originGitFilePath}复制文件到${syncGitFilePath}`)))
  copyFile(originGitFilePath, syncGitFilePath, passFileNames)
  if (Array.isArray(commitBeforeCommand)) {
    commitBeforeCommand.forEach((command) => {
      execaCommandSync(command, { stdio: 'inherit', cwd: syncGitFilePath })
    })
  }
  await gitAdd(syncGitFilePath)
  console.log(chalk.bold(chalk.bgYellow(`${syncGitFilePath} commit ${newCommitMsg}`)))
  await gitCommit(syncGitFilePath, newCommitMsg)
  console.log(chalk.bold(chalk.bgBlue(`push文件到${syncGitFilePath} 的 ${targetBranch}分支`)))
  await gitPush(syncGitFilePath, targetBranch)
  console.log(chalk.bold(chalk.bgBlue(`push文件到${originGitFilePath} 的 ${tempBranch}分支`)))
  await gitPush(originGitFilePath, tempBranch)

  console.log(chalk.bold(chalk.green('同步代码成功！')))
}

async function run({
  originGit, // 源仓库地址
  targetGit, // 目标仓库地址
  fromBranch, // 源仓库的分支
  targetBranch, // 目标仓库的分支
  commitBeforeCommand,
  syncPathName = 'sync', // 同步代码的文件夹名称
  basePath = '../', // 同步代码的文件夹路径
  tempBranch = '', // 临时分支
  commitMsg = 'chore: sync', // commit message
  mergeMsg = 'chore: merge', // merge message
}) {
  console.log(chalk.bold(chalk.green('同步代码开始...')))

  const syncPathExists = ensureSyncDir(syncPathName, basePath)
  const originGitFilePath = path.join(syncPathExists, 'origin')
  const syncGitFilePath = path.join(syncPathExists, 'sync')

  await checkoutOrigin(syncPathExists, originGitFilePath, originGit, tempBranch)
  await checkoutSync(syncPathExists, syncGitFilePath, targetGit, targetBranch)

  await checkOutFileToTempAndCopySyncFileToTemp({
    originGit,
    targetGit,
    targetBranch,
    commitBeforeCommand,
    tempBranch,
    syncPathExists,
    originGitFilePath,
    syncGitFilePath,
  })

  console.log(chalk.bold(chalk.green(`${fromBranch} merge 到 ${originGitFilePath} ${mergeMsg}`)))
  let mergePass = false
  try {
    await gitMerge(originGitFilePath, fromBranch, `${mergeMsg} ${fromBranch} to ${tempBranch}`)
    mergePass = true
  } catch (e) {
    console.log(e)
    console.log(chalk.bold(chalk.red(`${originGitFilePath} merge 到 ${fromBranch} 失败`)))

    console.log(
      chalk.bold(
        chalk.yellow(
          `请到 ${originGitFilePath} 手动解决冲突，然后再执行 实现了 originGitFilePath 的命令`,
        ),
      ),
    )
  }

  if (mergePass) {
    await mergeAfter({
      targetBranch, // 目标仓库的分支
      commitBeforeCommand,
      tempBranch, // 临时分支
      commitMsg, // commit message
      originGitFilePath,
      syncGitFilePath,
      fromBranch,
    })
  }
}

async function asyncAfterMergeConflict(props) {
  const {
    targetBranch,
    tempBranch,
    fromBranch,
    commitBeforeCommand,
    syncPathName = 'sync',
    basePath = '../',
    commitMsg = 'chore: sync',
  } = getParamsByPropsOrArgs(props) || {}

  console.log(chalk.bold(chalk.green('同步代码开始....')))
  const currentPath = path.resolve(basePath)

  const syncPathExists = path.join(currentPath, syncPathName)
  const originGitFilePath = path.join(syncPathExists, 'origin')
  const syncGitFilePath = path.join(syncPathExists, 'sync')

  await mergeAfter({
    targetBranch, // 目标仓库的分支
    commitBeforeCommand,
    tempBranch, // 临时分支
    commitMsg, // commit message
    originGitFilePath,
    syncGitFilePath,
    fromBranch,
  })
}

export { asyncAfterMergeConflict }

export default run
