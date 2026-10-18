---
'expo-modules-cli': patch
---

Parse command-line arguments with `arg`, the parser that `@expo/cli` uses, instead of `commander`. `expo` already installs `arg`, so the CLI no longer adds its own parser to the project. The short flag for `--version` is now `-v`, as in `npx expo`, and the `help` command is replaced by `--help`.
