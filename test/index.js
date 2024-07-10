import run from '../index.js'

run({
  originGit: 'git@github.com:threfo/git-sync-by-temp-branch.git',
  targetGit: 'git@github.com:threfo/git-sync-by-temp-branch.git',
  fromBranch: 'test',
  targetBranch: 'main',
  syncPathName: 'sync',
  tempBranch: 'temp',
})
