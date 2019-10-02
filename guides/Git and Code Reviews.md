# Git and Code Reviews at Expo

- [Git](#git)
  - [“master” is green](#-master--is-green)
  - [Develop on feature branches](#develop-on-feature-branches)
  - [One idea = one commit](#one-idea---one-commit)
  - [Rebasing: a linear history](#rebasing--a-linear-history)
  - [Pull and rebase often](#pull-and-rebase-often)
  - [Commit often](#commit-often)
  - [Squash before pushing](#squash-before-pushing)
  - [Code behind feature flags](#code-behind-feature-flags)
  - [Communicate with test plans](#communicate-with-test-plans)
- [Code Reviews](#code-reviews)
  - [Code reviews for the Expo team](#code-reviews-for-the-expo-team)
    - [Communicate with code reviews](#communicate-with-code-reviews)
    - [Choose one or two reviewers to clarify responsibility](#choose-one-or-two-reviewers-to-clarify-responsibility)
    - [Merge if you are the person responsible for the commit](#merge-if-you-are-the-person-responsible-for-the-commit)
  - [Code reviews for external contributions](#code-reviews-for-external-contributions)

# Git

Expo’s code is stored in Git repositories, including the Expo client repository. We generally develop on feature branches and then rebase those commits on top of the “master” branch. All of the Git repositories keep a linear history, which makes it easier to read the history, bisect issues, and revert commits.

## “master” is green

Almost all the code we write ends up on master (there are a few exceptions for bug fixes to existing releases, covered later). Since the whole team is working with master, we need to keep it in working condition and try to keep all tests passing and “green”.

## Develop on feature branches

We often work on new features on their own branches. This is the first step towards sending your code for review, and it also makes it easier to work on several features concurrently or switch back to master when you need to.

Name your branches something memorable for yourself. It’s common to accrue old branches and is helpful if you can quickly remember why you made them.

## One idea = one commit

Commits that are focused on one concept are easier to understand for the reviewer, easier to understand for people looking through the commit history (ex: if they are working on this code or looking for a commit that could have broken something), less likely to have merge conflicts, and easier to revert.

## Rebasing: a linear history

We rebase commits on top of master instead of merging them. The team’s understanding of Git and some of our tools revolve around a linear history — always rebase. Git can default `git pull` to rebase instead of merge on a per-branch basis. Tell it to use rebasing for your existing branches and all new branches with:

```sh
# Set rebase=true for your existing branches
git for-each-ref --shell \
  --format='git config branch.%(refname:lstrip=2).rebase true' \
  refs/heads/ | sh
# Set rebase=true for new branches in the future
git config branch.autosetuprebase always
```

## Pull and rebase often

Keep your master branch up to date. If you make your master branch use rebasing by default (see above), just run `git pull` on master.

Rebasing your feature branches often (`git rebase master`) also increases the likelihood your code works with master and decreases the likelihood of a large merge conflict instead of smaller ones.

If you’ve rebased a branch that you’ve sent for code review, you’ll need to force-push it to the remote branch on GitHub with `git push --force`. The Expo repository is configured to block accidental force-pushes to master.

## Commit often

On larger projects, send PRs and land them on master often. This makes each PR easier to review and gives you faster feedback on whether you’re working in the right direction. Frequent commits also reduce large spikes in the time you’re asking from your reviewer and reduce sudden changes to the codebase that may break something. They also help reduce the size of merge conflicts your teammates may encounter after pulling and rebasing on top of your changes. Keep your feature branches close to master.

## Squash before pushing

If you have more than one commit, squash them together before pushing if they are all part of the same idea. For example, commits that fix small bugs or address code review feedback usually should be squashed in the same commit. This makes it easier to read our commit log and revert commits. If some groups of your commits make more sense in isolation, then keep them separate.

## Code behind feature flags

Use simple flags — even a Boolean variable at the top of your file — to gate code that isn’t ready for production but that you still are committing to master. This way you can commit often without necessarily putting your code into action. It also lends itself to code that is easier to enable or disable experimentally without a lot of commitment.

## Communicate with test plans

Test plans are often effective at communicating the effects of your change. Write test plans as if you were explaining to a knowledgeable teammate how to test your change. Sometimes a test plan might just be “I ran the unit tests,” and other times they may be a manual QA process.

Test plans communicate the scope of your change and what to look for when reviewing your code or modifying your code in the future. Someone who is working on the same code may look through the commit history to understand your code better, and test plans help them understand what to look out for when they make their own changes. Similarly, a test plan helps calibrate your code reviewer’s confidence.

---

# Code Reviews

We use GitHub pull requests to send code for review. Code reviews help establish a better shared understanding of the code between the author and the reviewer(s).

For the Expo team, we use code reviews more as a tool than a rule. For external contributions, we require pull requests for all contributions.

## Code reviews for the Expo team

### Communicate with code reviews

Use code reviews to communicate in both directions between the author and reviewer(s). Send code reviews to tell a teammate about code or changes in behavior they should be aware of. Code reviews are also a way for reviewers to contribute their understanding of the codebase and their perspective as a reader.

Similarly, if you are working on a project that doesn’t affect other people and it’s not as important to communicate your changes, then you might not want to send a code review.

### Choose one or two reviewers to clarify responsibility

Choose a small number of reviewers so that it is clear to them they are responsible for reviewing your commit in a timely manner rather than expecting one of the other reviewers to do so.

### Merge if you are the person responsible for the commit

The person who is primarily responsible for maintaining a commit usually should be the one to merge it. For Expo team members, the term “pull request” is a misnomer within Expo; we aren’t requesting someone else to pull our code and usually the author should merge their commit.

We couple responsibility with merging so the person responsible for code is present when it lands. They are more aware of tests they may have broken, are available to answer questions about the code (e.g. whether a new error could be related to it, whether it is safe to deploy), can revert or fix new bugs, and can respond more quickly in general.

## Code reviews for external contributions

All pull requests must be reviewed and potentially merged by someone on the Expo team. The best way to get your PR reviewed is to make it easy to review and accept. See [the contribution guide](../CONTRIBUTING.md) for our expectations of contributions.

A maintainable PR is simple to understand and often small in scope. It is robust and unlikely to break if another part of the system is modified. It keeps related code close together and avoids prematurely separating concerns. It follows the coding standards implied by the codebase and Expo coding guidelines. It strikes a balance with enough code to provide a feature in a generalizable way.
