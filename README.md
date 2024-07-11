# git-sync

- 1、将 targetGit 的 targetBranch内容 全量覆盖到 originGit 的 tempBranch ，commit 一次

- 2、将 originGit 的 fromBranch 内容 合并到 originGit 的 tempBranch

- 3、originGit 的 tempBranch 全量覆盖到 targetGit 的 targetBranch, 且 push tempBranch 本次操作

```js
import run from 'git-sync-to-other-git-by-temp'

run({
  originGit: 'git@github.com:threfo/git-sync-by-temp-branch.git',
  targetGit: 'git@github.com:threfo/git-sync-by-temp-branch.git',
  fromBranch: 'test',
  targetBranch: 'main',
  syncPathName: 'sync',
  tempBranch: 'temp',
})
```
