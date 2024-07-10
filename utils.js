import path from 'path'
import fs from 'fs-extra'
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

export const checkoutSync = async (syncPathExists, syncGitFilePath, gitPath, branchName) => {
  console.log(`clone 目标 ${gitPath} 到 ${syncPathExists}`)
  await clone(gitPath, 'sync', syncPathExists)
  console.log(`checkout ${branchName} 成 ${syncGitFilePath}`)
  await checkout('sync', `origin/${branchName}`, syncGitFilePath)
}

export const ensureSyncDir = (syncPathName, basePath) => {
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

export const checkoutOrigin = async (syncPathExists, originGitFilePath, gitPath, branchName) => {
  console.log(`clone 源 ${gitPath} 到 ${syncPathExists}`)
  await clone(gitPath, 'origin', syncPathExists)
  console.log(`checkout ${branchName} 成 ${originGitFilePath}`)
  await checkout('wait_sync', `origin/${branchName}`, originGitFilePath)
}

export const removeSyncGitOldFile = (syncGitFilePath, passFileNames) => {
  const dirNames = fs.readdirSync(syncGitFilePath)

  dirNames
    .filter((path) => !passFileNames.includes(path))
    .forEach((path) => {
      const removePath = `${syncGitFilePath}/${path}`
      console.log('remove', removePath)
      fs.removeSync(removePath)
    })
}

export const copyFile = (originGitFilePath, syncGitFilePath, passFileNames) => {
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
