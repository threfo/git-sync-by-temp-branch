import path from "path"
import fs from "fs-extra"
import { execa } from "execa"

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
    await clone(gitPath, 'sync', syncPathExists)
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
  await clone(gitPath, 'origin', syncPathExists)
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