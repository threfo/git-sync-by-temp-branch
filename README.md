# git-sync
1、originGit 临时分支（tempBranch）全量同步 target仓库（targetGit）的某个分支（targetBranch）内容，commit 一次
2、originGit 临时分支（tempBranch）merge fromBranch
3、originGit 临时分支（tempBranch）同步到 target仓库（targetGit）的某个分支（targetBranch）

```js

import run from "git-sync";

console.log('test update')

run({
    originGit: 'git@github.com:threfo/git-sync.git',
    targetGit:'git@github.com:threfo/git-sync.git',
    fromBranch: 'test',
    targetBranch: 'main',
    syncPathName: 'sync',
})
```