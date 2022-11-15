# git-sync
将某个git仓库某个分支的代码同步到另一个仓库的某个分支

```js

import run from "git-sync";

run({
    originGit: 'git@github.com:threfo/git-sync.git',
    targetGit:'git@github.com:threfo/git-sync.git',
    fromBranch: 'test',
    targetBranch: 'main',
    syncPathName: 'sync',
})
```