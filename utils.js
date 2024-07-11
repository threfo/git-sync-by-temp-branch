import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { execa } from 'execa'

export const checkout = (to, from, cwd) =>
  execa('git', ['checkout', '-b', to, from], { stdio: 'inherit', cwd })

export const clone = (from, pathName, cwd) =>
  execa('git', ['clone', from, pathName], { stdio: 'inherit', cwd })

export const gitMerge = (cwd, branch, msg = '"chore: sync merge"') =>
  execa('git', ['merge', '-m', msg, `origin/${branch}`], { stdio: 'inherit', cwd })

export const gitAdd = (cwd) => execa('git', ['add', '.'], { stdio: 'inherit', cwd })

export const gitCommit = (cwd, msg) =>
  execa('git', ['commit', '-m', msg], { stdio: 'inherit', cwd })

export const gitPush = (cwd, branch = 'develop', origin = 'origin') =>
  execa('git', ['push', origin, `HEAD:${branch}`], { stdio: 'inherit', cwd })

const gitLogToJson = (s) => {
  // console.log('gitLogToJson', s)
  const commits = s.split('commit ') // 分割每个commit
  const result = []

  commits.forEach((commit) => {
    // console.log(i, 'commit', commit)
    const lines = commit.split('\n')

    const [commitId, ...otherLines] = lines
    const commitObj = { commitId }

    otherLines.forEach((line) => {
      // console.log(`${i}-${j}`, 'line', line)
      if (line.startsWith('Author: ')) {
        commitObj.author = line.replace('Author: ', '').trim()
      } else if (line.startsWith('Date: ')) {
        commitObj.date = new Date(line.replace('Date: ', '').trim())
      }
    })

    const dateIndex = otherLines.findIndex((line) => line.startsWith('Date: '))
    let messageLines = otherLines.slice(dateIndex + 1)

    messageLines = messageLines
      .join('\n')
      .trim()
      .split('\n')
      .filter((i) => !i.trim().startsWith('Merge '))

    // 把messageLines内重复的字符串去掉
    messageLines = Array.from(new Set(messageLines))

    commitObj.message = messageLines.join('\n').trim()
    // console.log(i, 'commitObj', JSON.stringify(commitObj))
    result.push(commitObj)
  })

  return result.filter((item) => item.message !== 'Initial commit' && item.message !== '')
}

export const getGitLog = async (cwd) => {
  const { stdout } = await execa({
    // stdout: ['pipe', 'inherit'],
    cwd,
  })`git log -1000`

  const list = gitLogToJson(stdout)

  // console.log(chalk.bold(chalk.yellow('stdout', JSON.stringify(list))))

  return list
}

const findLastSyncCommitId = (logs, matchMsg) => {
  const log = logs.find(({ message }) => message.includes(matchMsg))
  const { message } = log || {}
  const list = message.split('\n')
  const lastSyncCommit = list.find((item) => item.trim().startsWith('CommitId: ')) || ''
  let lastSyncCommitId = lastSyncCommit.replace('CommitId: ', '')

  // console.log(chalk.bgGreen('findLastSyncDate lastSyncCommitId', lastSyncCommitId))
  return lastSyncCommitId.trim()
}

export const getCommitMsg = async (originGitFilePath, syncGitFilePath, matchMsg) => {
  const originGitLogs = await getGitLog(originGitFilePath)
  // console.log(chalk.bgGreen('originGitLogs', JSON.stringify(originGitLogs)))

  const syncGitLogs = await getGitLog(syncGitFilePath)

  // console.log(chalk.bgYellow('syncGitLogs', JSON.stringify(syncGitLogs)))
  const lastSyncCommitId = findLastSyncCommitId(syncGitLogs, matchMsg)

  let msgArr = []
  if (lastSyncCommitId) {
    const lastIndex = originGitLogs.findIndex(({ commitId }) => commitId === lastSyncCommitId)
    // console.log(chalk.red('lastIndex', lastIndex))
    const needCommitLogs = originGitLogs.slice(0, lastIndex)

    msgArr = needCommitLogs
      .map(({ message }) => message)
      .join('\n')
      .trim()
      .split('\n')

    // 把messageLines内重复的字符串去掉
    msgArr = Array.from(new Set(msgArr))

    // console.log(chalk.bgRed('msg', msgArr.join('\n')))
  }

  const [thisTimeCommit] = originGitLogs
  const { commitId: thisTimeCommitId } = thisTimeCommit || {}
  const thisTimeMsg = `CommitId: ${thisTimeCommitId}`

  return [matchMsg, '', thisTimeMsg, ...msgArr].join('\n')
}

export const checkoutSync = async (syncPathExists, syncGitFilePath, gitPath, branchName) => {
  console.log(chalk.bold(chalk.yellow(`clone 目标 ${gitPath} 到 ${syncPathExists}`)))
  await clone(gitPath, 'sync', syncPathExists)
  console.log(chalk.bold(chalk.yellow(`checkout ${branchName} 到 ${syncGitFilePath}`)))
  await checkout('sync', `origin/${branchName}`, syncGitFilePath)
}

export const ensureSyncDir = (syncPathName, basePath) => {
  const currentPath = path.resolve(basePath)

  const syncPathExists = path.join(currentPath, syncPathName)
  const isSyncPathExists = fs.existsSync(syncPathExists)

  if (isSyncPathExists) {
    fs.removeSync(syncPathExists)
  }
  fs.ensureDirSync(syncPathExists)

  console.log('代码同步操作地址', syncPathExists)
  return syncPathExists
}

export const checkoutOrigin = async (syncPathExists, originGitFilePath, gitPath, branchName) => {
  console.log(chalk.bold(chalk.yellow(`clone 源 ${gitPath} 到 ${syncPathExists}`)))
  await clone(gitPath, 'origin', syncPathExists)
  console.log(chalk.bold(chalk.yellow(`checkout ${branchName} 到 ${originGitFilePath}`)))
  await checkout('wait_sync', `origin/${branchName}`, originGitFilePath)
}

export const removeSyncGitOldFile = (syncGitFilePath, passFileNames) => {
  const dirNames = fs.readdirSync(syncGitFilePath)

  dirNames
    .filter((filePath) => !passFileNames.includes(filePath))
    .forEach((filePath) => {
      const removePath = path.join(syncGitFilePath, filePath)
      // console.log('remove', removePath)
      fs.removeSync(removePath)
    })
}

export const copyFile = (originGitFilePath, syncGitFilePath, passFileNames) => {
  const dirNames = fs.readdirSync(originGitFilePath)

  dirNames
    .filter((filePath) => !passFileNames.includes(filePath))
    .forEach((filePath) => {
      const fromPath = path.join(originGitFilePath, filePath)
      const toPath = path.join(syncGitFilePath, filePath)
      // console.log('copy', fromPath, 'to', toPath)
      fs.copySync(fromPath, toPath)
    })
}

export function getArgs() {
  const args = {}
  process.argv.slice(2, process.argv.length).forEach((arg) => {
    // long arg
    if (arg.slice(0, 2) === '--') {
      const longArg = arg.split('=')
      const longArgFlag = longArg[0].slice(2, longArg[0].length)
      const longArgValue = longArg.length > 1 ? longArg[1] : true
      args[longArgFlag] = longArgValue
    }
    // flags
    else if (arg[0] === '-') {
      const flags = arg.slice(1, arg.length).split('')
      flags.forEach((flag) => {
        args[flag] = true
      })
    }
  })
  return args
}

export function getParamsByPropsOrArgs(props = {}) {
  const args = getArgs() || {}
  const temp = { ...props, ...args }
  return temp
}
