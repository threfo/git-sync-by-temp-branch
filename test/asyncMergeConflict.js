

 
async function run({
    originGit,
    targetGit,
    fromBranch,
    targetBranch,
    commitBeforeCommand,
    syncPathName = 'sync',
    basePath = '../',
    tempBranch = '',
    commitMsg = '"chore: sync"',
    mergeMsg = '"chore: merge"'
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
    if (isGitDirty(originGitFilePath)) {
        console.log(chalk.bold(chalk.green('tempBranch 同步完 targetBranch commit 之前')))
        await gitAdd(originGitFilePath)
        await gitCommit(originGitFilePath, commitMsg)
    } else {
        console.log(chalk.bold(chalk.green('targetBranch 和 tempBranch 一致')))
    }
    // 1 end

    // 2 
    console.log(chalk.bold(chalk.green('merge 之前')))
    await gitMerge(originGitFilePath, fromBranch, mergeMsg)
    // 2 end

    console.log(chalk.bold(chalk.green('同步代码成功！')))
}

async function asyncAfterMergeConflict ({
    commitBeforeCommand,
    syncPathName = 'sync',
    basePath = '../',
    commitMsg = '"chore: sync"',
}) {
    console.log(chalk.bold(chalk.green('同步代码开始...')))

    const syncPathExists = ensureSyncDir(syncPathName, basePath)

    const originGitFilePath = `${syncPathExists}/origin`
    const syncGitFilePath = `${syncPathExists}/sync`
    const passFileNames = ['.git', '.github', '.husky']

    removeSyncGitOldFile(syncGitFilePath, passFileNames)
    copyFile(originGitFilePath, syncGitFilePath, passFileNames)
    if (Array.isArray(commitBeforeCommand)) {
        commitBeforeCommand.forEach((command) => {
            execaCommandSync(command, { stdio: 'inherit', cwd: syncGitFilePath })
        })
    }
    await gitAdd(syncGitFilePath)
    await gitCommit(syncGitFilePath, commitMsg)
    await gitPush(syncGitFilePath)
    await gitPush(originGitFilePath)

    console.log(chalk.bold(chalk.green('同步代码成功！')))
}

run({
    originGit: 'git@github.com:threfo/git-sync-by-temp-branch.git',
    targetGit:'git@github.com:threfo/git-sync-by-temp-branch.git',
    fromBranch: 'test',
    targetBranch: 'main',
    syncPathName: 'sync',
    tempBranch: 'temp'
}).then(() => {
    asyncAfterMergeConflict()
})
