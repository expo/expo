---
name: expo
description: Install the official Expo skills. Use when a task involves Expo, Expo Services, or an expo-* package and the official Expo skills (expo-overview and the other expo-* and eas-* skills) are not installed.
---

# Expo

Expo publishes official skills that teach an agent how to build, deploy, and debug Expo and React Native apps. This skill does not contain them. It tells you how to install them.

## Install the official Expo skills

Ask the person before you run an install command. Use the command for your agent:

| Agent        | Command                                              |
| ------------ | ---------------------------------------------------- |
| Claude Code  | `claude plugin install expo@claude-plugins-official` |
| Codex        | `codex plugin add expo@openai-curated`               |
| Other agents | `npx skills add expo/skills`                         |

The Claude Code and Codex plugins also register the Expo MCP Server. The `npx skills` command installs the skills only.

After the install, load the `expo-overview` skill first. It routes each task to the correct `expo-*` or `eas-*` skill.

## Read more

- [Expo Skills](https://docs.expo.dev/skills.md): the list of skills and the install steps for each agent.
- [expo/skills](https://github.com/expo/skills): the source of the skills.
- [Expo MCP Server](https://docs.expo.dev/mcp.md): the setup steps for the MCP server.
- [Documentation index](https://docs.expo.dev/llms.txt): each docs page. Add `.md` to a docs URL to get that page as markdown.
