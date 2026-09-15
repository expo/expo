# Release Branches

- [Release Branches](#release-branches)
  - [Example](#example)
  - [Edge cases](#edge-cases)
    - [The bug has been fixed on main but not on the release branch.](#the-bug-has-been-fixed-on-main-but-not-on-the-release-branch)
    - [main has significantly diverged from the release branch.](#main-has-significantly-diverged-from-the-release-branch)
    - [It’s easier to write and test the fix on the release branch instead of main.](#it-s-easier-to-write-and-test-the-fix-on-the-release-branch-instead-of-main)
- [Versioning Android and iOS Code](#versioning-android-and-ios-code)
- [Incrementing Version Numbers](#incrementing-version-numbers)
  - [Prerelease Versions](#prerelease-versions)
  - [Shortcomings](#shortcomings)

The release process begins when we decide that Expo Go and the libraries on `main` are ready for the next release. During an SDK beta we may publish version-package merges from `main` under the `next` npm dist-tag. Once the beta ends, stable package publishing from `main` is disabled and releases move to the SDK branch.

The release branch is named `sdk-XX` and is based on main. The main purpose of the release branch is to release new versions of Expo Go and the SDK libraries; we use the release branch to build the Expo Go apps we submit to the app stores and to publish our JS libraries to npm.

After creating the release branch, we usually will need to fix bugs. These bug fixes usually will be applicable to both the release branch and main and we want to ensure that both branches receive the fix. We maintain one invariant: **commits flow in one direction from main to the release branch.**

These are three guidelines to achieve this:

1. After the beta cutoff, release from the release branch, not from `main`.
2. Commit bug fixes first to main, not to the release branch.
3. Cherry-pick the bug fixes from main to the release branch.

In addition to preserving the invariant, these guidelines help set expectations for our team as to the latest versions of packages and which commits need to be cherry-picked to which branches.

Package release intent is recorded in `.changeset/*.md` files. The release workflow creates a `Version packages (sdk-XX)` pull request that calculates versions and generated files; merging that pull request publishes the new package versions. Do not manually edit package versions or package changelogs.

## Example

Here’s what a typical bug fix would look like. If we find a bug in the release, we fix it on `main` and include a changeset for the affected packages. We then cherry-pick the fix and its changeset to the release branch. The release workflow updates the branch's version pull request, which we merge when the fix is ready to publish.

This way, the bug-fix commit and its changeset are on both `main` and the release branch. The generated version commit is merged only on the release branch. The next release can then calculate its package updates from new changesets while the branch continues to represent the code published for that SDK.

## Edge cases

There are some edge cases or exceptions to the guidelines above.

### The bug has been fixed on main but not on the release branch.

This can happen for several reasons; for example, we may have done a significant dependency upgrade (e.g., upgrading React’s major version) on main and fix a bug that is still present on the release branch. We probably don’t want to perform the same upgrade on the release branch, especially if we’re looking to publish a patch or minor version, and need to fix the bug another way on the release branch. In this case, since the bug fix is applicable only to the release branch, we don’t need to commit it to main first.

### main has significantly diverged from the release branch.

Sometimes code on main will be significantly different than code on a release branch. This is especially true if we’ve landed a large series of commits on main, made a significant codebase-wide change, or are looking to fix a bug in an older release branch. In this case, the commit to fix the bug on main may look quite different than the commit to fix the bug on the release branch. Logically, we still want to commit the bug fix to main first and then copy it to the release branch, but in practice, `git cherry-pick` may produce merge conflicts that are especially difficult to reconcile. In this case, instead of cherry-picking, we should commit a separate bug fix to the release branch.

### It’s easier to write and test the fix on the release branch instead of main.

It’s OK to write the fix on your local copy of the release branch if it’s easier to develop that way. If a tree falls in a forest and no one is around to hear it, does it make a sound? But when it comes time to send the commit for code review and push it to GitHub, commit it to the main branch first.

Note that even with these edge cases, we always preserve the unidirectional commit invariant.

# Versioning Android and iOS Code

When we version the native SDK code, we need to be able to test that versioned code and commit it to main without new commits to main breaking the versioned code. We defer merging high-risk commits or commits that affect many files until after the versioned code has been committed. This time period should be very short so the team can commit to main as usual as soon as possible.

# Incrementing Version Numbers

(This section is under development as we figure out what works well for us.)

This section is intended for people responsible for the release. Package versions are calculated by Changesets from committed release intent and dependency propagation. There is one invariant we still need to maintain: **when we create the next release branch, all versions on that branch must be equal to or greater than the greatest versions already published.**

These are some general guidelines to achieve this:

When a library change is compatible with an SDK we have already released or plan to release, add the appropriate changeset on the release branch and let the version pull request calculate its new version. These will typically be patch changes.

Changes requiring a package major bump belong on `main`; major changesets are rejected on `sdk-*` release branches. Major package versions are normally advanced while preparing a new SDK line. Compatible features may use a minor changeset, while fixes use a patch changeset.

## Prerelease Versions

During beta, version-package merges from `main` are published under the `next` npm dist-tag. The packages do not all need prerelease suffixes: templates install the intended Expo version, and workspace dependencies are materialized when packages are packed. Canary snapshots are published separately under the configured canary tag.

## Shortcomings

Versioning dozens of packages that have different types of breaking changes is complicated. The versioning guidelines above are not water-tight and issues could slip through. For example, if we increment a patch version on an older release branch and don't eventually update past it on main, the version on the next release branch will be behind the latest version we've actually published. Overall, we need to be thoughtful and aware of the state of our release branches and published versions when we increment versions and make good decisions as we go. If we maintain the invariant of keeping versions on each new release branch up to date, we'll keep our versioning process mostly working well.
