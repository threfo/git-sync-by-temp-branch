
import run from "../index.js";

run({
    originGit: 'git@github.com:threfo/git-sync.git',
    targetGit:'git@github.com:threfo/git-sync.git',
    fromBranch: 'main',
    targetBranch: 'test',
    syncPathName: 'sync',
})