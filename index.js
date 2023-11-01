
import fs from "fs-extra"
import chalk from "chalk"
import path from "path"
import { execa, execaCommandSync } from "execa"

const checkout = (to, from, cwd) =>
  execa('git', ['checkout', '-b', to, from], { stdio: 'inherit', cwd })
const clone = (from, pathName, cwd) =>
  execa('git', ['clone', from, pathName], { stdio: 'inherit', cwd })

const gitMerge = (cwd, branch, msg = 'sync merge') =>
  execa('git', ['merge', '-m', msg, `origin/${branch}`], { stdio: 'inherit', cwd })

const gitAdd = (cwd) => execa('git', ['add', '.'], { stdio: 'inherit', cwd })

const gitCommit = (cwd, msg) =>
  execa('git', ['commit', '-m', msg], { stdio: 'inherit', cwd })

const gitPush = (cwd, branch = 'develop', origin = 'origin') =>
  execa('git', ['push', origin, `HEAD:${branch}`], { stdio: 'inherit', cwd })


const ensureSyncDir = (syncPathName, basePath) => {

  const currentPath = path.resolve(basePath)

  const syncPathExists = `${currentPath}/${syncPathName}`
  const isSyncPathExists = fs.existsSync(syncPathExists)

  if (isSyncPathExists) {
    fs.removeSync(syncPathExists)
  }
  fs.ensureDirSync(syncPathExists)

  console.log('代码同步操作地址', syncPathExists)
  return syncPathExists
}

const checkoutOrigin = async (syncPathExists, originGitFilePath, gitPath, branchName) => {
  await clone(gitPath, 'origin', syncPathExists)
  await checkout('wait_sync', `origin/${branchName}`, originGitFilePath)
}

const checkoutSync = async (syncPathExists, syncGitFilePath, gitPath, branchName) => {
  await clone(gitPath, 'sync', syncPathExists)
  await checkout('sync', `origin/${branchName}`, syncGitFilePath)
}

const removeSyncGitOldFile = (syncGitFilePath, passFileNames) => {
  const dirNames = fs.readdirSync(syncGitFilePath)

  dirNames
    .filter((path) => !passFileNames.includes(path))
    .forEach((path) => {
      const removePath = `${syncGitFilePath}/${path}`
      console.log('remove', removePath)
      fs.removeSync(removePath)
    })
}

const copyFile = (originGitFilePath, syncGitFilePath, passFileNames) => {
  const dirNames = fs.readdirSync(originGitFilePath)

  dirNames
    .filter((path) => !passFileNames.includes(path))
    .forEach((path) => {
      const fromPath = `${originGitFilePath}/${path}`
      const toPath = `${syncGitFilePath}/${path}`
      console.log('copy', fromPath, 'to', toPath)
      fs.copySync(fromPath, toPath)
    })
}

async function run({
  originGit,
  targetGit,
  fromBranch,
  targetBranch,
  commitBeforeCommand,
  syncPathName = 'sync',
  basePath = '../',
  tempBranch = '',
  commitMsg = '"chore: sync"'
}) {
  console.log(chalk.bold(chalk.green('同步代码开始...')))

  // 1
  const syncPathExists = ensureSyncDir(syncPathName, basePath)

  const originGitFilePath = `${syncPathExists}/origin`
  const syncGitFilePath = `${syncPathExists}/sync`
  const passFileNames = ['.git', '.github', '.husky']

  await checkoutOrigin(syncPathExists, originGitFilePath, originGit, tempBranch)
  await checkoutSync(syncPathExists, syncGitFilePath, targetGit, targetBranch)

  // 1
  removeSyncGitOldFile(originGitFilePath, passFileNames)
  copyFile(syncGitFilePath, originGitFilePath, passFileNames)
  if (Array.isArray(commitBeforeCommand)) {
    commitBeforeCommand.forEach((command) => {
      	execaCommandSync(command, { stdio: 'inherit', cwd: syncGitFilePath })
    })
  }
  await gitAdd(originGitFilePath)
  await gitCommit(originGitFilePath, commitMsg)
  // 1 end

  // 2 
  await gitMerge(originGitFilePath, fromBranch)
  // 2 end
  
  // 3
  removeSyncGitOldFile(syncGitFilePath, passFileNames)
  copyFile(originGitFilePath, syncGitFilePath, passFileNames)
  await gitAdd(syncGitFilePath)
  await gitCommit(syncGitFilePath, commitMsg)
  await gitPush(syncGitFilePath, targetBranch)
  await gitPush(originGitFilePath, tempBranch)
  // 3 end

  console.log(chalk.bold(chalk.green('同步代码成功！')))
}

export default run