# Our Open Source Standards

- [Code reviews](#code-reviews)
- [Guidance](#guidance)
  - [On coherent pull requests](#on-coherent-pull-requests)
  - [On maintainable code](#on-maintainable-code)

## Code reviews

The Expo team reviews all PRs and makes the judgement call on whether to accept them. An Expo team member will look at each PR and assign it to the appropriate reviewer for an in-depth review or request changes.

Writing a maintainable PR as described above is the best way to get it reviewed timely and potentially accepted. The easier to review and maintain the code, the more likely it will be accepted.

## Guidance

### On coherent pull requests

Each PR should correspond to one idea and implement it coherently. This idea may be a feature that spans several parts of the codebase. For example, changing an API may include changes to the Android, iOS, and web implementations, the JavaScript SDK, and the docs for the API.

Generally, each PR should contain one commit that is amended as you address code review feedback. Each commit should be meaningful and make sense on its own. Similarly, it should be easy to revert each commit. This keeps the commit history easier to read when people are working on this code or searching for a commit that could have broken something.

### On maintainable code

Code is much more expensive to maintain than it is to write. A maintainable PR is much more likely to be accepted.

A maintainable PR is simple to understand and often small in scope. It is robust and unlikely to break if another part of the system is modified. It keeps related code close together and avoids prematurely separating concerns. It follows the coding standards implied by the codebase and Expo coding guidelines. It strikes a balance with enough code to provide a feature that's widely useful without being overly generalized. A maintainable PR minimizes the attention it needs as the codebase changes over time.

Tests and types can improve maintainability and we expect PRs to include them. In particular, use tests to demonstrate the behavior of edge cases that are less likely to occur than the common code path. It is the edge cases we are less likely to notice if they break, and it is the edge cases that we need to behave correctly when they expose an issue in an app and the developer needs to debug. It is relatively easy to get code working; write tests to keep the code working.

However, tests and types can also obstruct maintainability. Overfitted tests break more often and are more difficult to update even when refactoring code that doesn't change its public API. They consume time and attention. Some APIs don't lend themselves well to static typing and lead to precarious type definitions that are not simple to understand or modify. We use tests and types as a means to an end, not an end to zealously pursue.
