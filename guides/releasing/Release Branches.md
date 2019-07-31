# Release Branches

The release process begins when we decide that the clients and libraries on the master branch are ready for the next release. We try to keep the tests always passing on master so that we can release at any time but we don’t release from master. Instead, we create a release branch.

The release branch is named `sdk-XX` and is based on master. The main purpose of the release branch is to release new versions of the clients and libraries; we use the release branch to build the clients we submit to the app stores and to publish our JS libraries to npm.

After creating the release branch, we usually will need to fix bugs. These bug fixes usually will be applicable to both the release branch and master and we want to ensure that both branches receive the fix. We maintain one invariant: **commits flow in one direction from master to the release branch.**

These are three guidelines to achieve this:

1. Release from the release branch, not from master.
2. Commit bug fixes first to master, not to the release branch.
3. Cherry-pick the bug fixes from master to the release branch.

In addition to preserving the invariant, these guidelines help set expectations for our team as to the latest versions of packages and which commits need to be cherry-picked to which branches.

## Example

Here’s what a typical bug fix would look like. If we find that there is a bug with the release that we want to fix, we’d check out master and look to fix the bug there. Assuming that we can reproduce and fix the bug on master, we commit the fix and then cherry-pick it to the release branch. If we need to publish a new patch or minor version, we make a commit to increment the relevant versions on the release branch and publish the new clients or libraries.

This way, the bug-fix commit is on both master and the release branch, and the version-incrementing commit is only on the release branch. The next time we publish another release, the release branch will show us the exact code and version used for the prior release.

## Edge cases

There are some edge cases or exceptions to the guidelines above.

### The bug has been fixed on master but not on the release branch.

This can happen for several reasons; for example, we may have done a significant dependency upgrade (e.g., upgrading React’s major version) on master and fix a bug that is still present on the release branch. We probably don’t want to perform the same upgrade on the release branch, especially if we’re looking to publish a patch or minor version, and need to fix the bug another way on the release branch. In this case, since the bug fix is applicable only to the release branch, we don’t need to commit it to master first.

### Master has significantly diverged from the release branch.

Sometimes code on master will be significantly different than code on a release branch. This is especially true if we’ve landed a large series of commits on master, made a significant codebase-wide change, or are looking to fix a bug in an older release branch. In this case, the commit to fix the bug on master may look quite different than the commit to fix the bug on the release branch. Logically, we still want to commit the bug fix to master first and then copy it to the release branch, but in practice, `git cherry-pick` may produce merge conflicts that are especially difficult to reconcile. In this case, instead of cherry-picking, we should commit a separate bug fix to the release branch.

### It’s easier to write and test the fix on the release branch instead of master.

It’s OK to write the fix on your local copy of the release branch if it’s easier to develop that way. If a tree falls in a forest and no one is around to hear it, does it make a sound? But when it comes time to send the commit for code review and push it to GitHub, commit it to the master branch first.

Note that even with these edge cases, we always preserve the unidirectional commit invariant.
