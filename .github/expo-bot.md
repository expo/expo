# expo-bot

These commands run on the [expo/expo](https://github.com/expo/expo) repository — Expo’s open-source SDK, apps, and docs. Mention `@expo-bot` on an [issue](https://github.com/expo/expo/issues) or [pull request](https://github.com/expo/expo/pulls) there, or use the slash form. They do nothing on other repos. Only people with write access on expo/expo (OWNER / MEMBER / COLLABORATOR) can trigger them.

Comment `@expo-bot help` on an expo/expo thread for a short list. That command also publishes this file to the [expo-bot profile](https://github.com/expo-bot) when the copy there is behind. A daily cron does the same publish.

## Commands

| Mention | Slash | Where | What it does |
| --- | --- | --- | --- |
| `@expo-bot help` | — | issue or PR | Post a short command list and a link here |
| `@expo-bot verify` | `/verify` | issue or PR | Investigate and post attested findings. On an issue, also opens a fix PR when it can. On a PR, report only unless `--fix`. |
| `@expo-bot verify --fix` | `/verify --fix` | PR (on an issue, fix is already the default) | Also attempt a fix pull request |
| `@expo-bot verify --no-fix` | `/verify --no-fix` | issue or PR | Report only; never open a PR |
| `@expo-bot review` | `/review`, `/expo-review` | PR | One-shot AI review; router picks agents |
| `@expo-bot review all` | `/review all` | PR | Review with every agent |
| `@expo-bot review <agents>` | `/review <agents>` | PR | Review with a named subset (`correctness security`, …) |
| `@expo-bot dismiss <id>…` | `/dismiss <id>…` | PR | Hide reviewer finding(s); optional `-- reason` |
| `@expo-bot undismiss <id>…` | `/undismiss <id>…` | PR | Restore finding(s) |
| `@expo-bot <task>` | — | open PR **authored by expo-bot** | Carry out that follow-up and push to the same PR |

A bare `@expo-bot` is the same as `@expo-bot help`.

Incidental mentions in the middle of a comment do nothing. The command has to start the comment.

## Notes

- **Review / dismiss / work** are pull-request only.
- **Verify and help** also run on issues. On an issue, `/verify` will open a fix PR when it can; on a pull request it reports only unless you pass `--fix`.
- **Work mode** (`@expo-bot <task>`) only updates PRs expo-bot itself opened. It will not push to a contributor branch.
- Reserved verbs (`help`, `verify`, `review`, `dismiss`, `undismiss`) are never treated as a work-mode task.

## Continuous review

Label a same-repo PR `ai-review` to run the reviewer on every push. That label cannot start a review on a fork PR (GitHub withholds secrets). Comment `@expo-bot review` instead.
