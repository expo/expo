# Agent instructions

Coding agents that change this repository follow this file. Human contributors follow the same pull request rules in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Read first

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md). It is the source for setup, package scripts, tests, documentation, and changesets. Do not copy those steps into a new guide.
2. If the directory you will edit contains `AGENTS.md`, read that file too. The closer file wins.
3. Read the code and the tests around the lines you will change. Then edit.

## Internal and external contributors

The code rules and the pull request rules are the same.

- An Expo team member clones this repository. An external contributor forks it and opens the pull request from the fork. See [Download and Setup](./CONTRIBUTING.md#-download-and-setup).
- Do SDK work in `apps/bare-expo`. Do not use Expo Go. Expo Go needs API tokens and is hard to set up.
- This repository does not support Windows. Use WSL.
- Do not bump native dependency versions. The Expo team does that for each SDK. See [Finding a task to work on](./CONTRIBUTING.md#finding-a-task-to-work-on).

## Make the change

- Change only the lines the problem needs. Do not reformat untouched code. Do not mix in a second fix.
- One published package per pull request, plus its changeset. A documentation change that can land alone goes in its own pull request.
- Follow the style guides linked from [Style](./CONTRIBUTING.md#style).
- Run `et check-packages <package>` for each package you changed. See [Before Submitting](./CONTRIBUTING.md#-before-submitting).
- Add a changeset for a user-facing package change. Do not edit `CHANGELOG.md`. See [Recording Package Changes](./CONTRIBUTING.md#-recording-package-changes).
- If you change a config plugin, the pull request must work with `npx expo prebuild` and EAS Build.
- If you edit versioned docs, copy the change to `docs/pages/versions/unversioned/`. See [Updating Documentation](./CONTRIBUTING.md#-updating-documentation).

## Comments

Do not add a comment the change does not need.

- Do not add a comment that repeats the next line.
- Do not put the history of the bug in a comment. Put that history in the pull request `Why` section.
- Keep a comment only when the code cannot show the constraint. A platform bug, a required call order, or a value you must not change are examples.
- Delete a comment that your change makes false.

## Tests

Do not add a unit test the change does not need.

- Add a unit test only when it fails before your change and passes after it.
- Do not add a test that already passes on the old code.
- Do not add a test that mocks the function you changed and then asserts on that mock.
- Do not add a snapshot or a large fixture for a one-line fix.
- A native change with no unit-test seam needs steps in the Test Plan. Do not add a test file that cannot run the native code.
- Test layout, Jest mocks, and end-to-end tests are in [Testing Your Changes](./CONTRIBUTING.md#-testing-your-changes).

## Pull requests

Follow [Opening a pull request](./CONTRIBUTING.md#-opening-a-pull-request) and keep the headings in [.github/PULL_REQUEST_TEMPLATE](./.github/PULL_REQUEST_TEMPLATE).

- Keep the diff small enough to read in one pass. If the change has more than one reason, split it into a stack. Each pull request does one thing. Set its base branch to the previous pull request. After one merges, retarget the next to `main`.
- List the stack order in `How`, and say which pull request this one is.
- Write the title and the body in Simplified Technical English: short sentences, one fact in each sentence, active voice, and one word for one thing. You do not need the ASD-STE100 specification.
- `Why` states the problem, then the root cause.
- `How` answers how you built the feature or fixed the bug, and why. Describe each solution, its performance impact, and why you believe this is the right fix. Then say what the diff changes.
- `Test Plan` says what you ran, where you ran it, and the result. If you did not run a test, say that and open the pull request as a draft.
- A fix that the report limits to some devices must stay limited to those devices. If every device must get the change, say why in `How`.
- Delete the template's HTML comments when you fill the body.
- Do not open a pull request you cannot explain in a review reply. Answer questions on that pull request.

## Do not

- Do not commit `build/` output, debug logs, `console.log`, or commented-out code.
- Do not open a stack of unrelated fixes.
