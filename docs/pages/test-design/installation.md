---
title: Installation
subtitle: Get started with Expo in less than five minutes.
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

Expo is a framework and a platform for universal React applications. It is a set of tools and services built around React Native and native platforms that help you develop, build, deploy, and quickly iterate on iOS, Android, and web apps from the same JavaScript/TypeScript codebase.

## Expo CLI

Expo CLI is a command line app that is the main interface between a developer and Expo tools. Expo CLI also has a web-based GUI that pops up in your web browser when you start your project — you can use the GUI instead of the command line interface if you're not yet comfortable using a terminal or prefer GUIs, both have similar capabilities.

### Requirements

- Node.js LTS release
- Git
- Watchman for macOS users

> Only Node.js LTS releases (even-numbered) are recommended. As Node.js [officially states](https://nodejs.org/en/about/releases/), "Production applications should only use Active LTS or Maintenance LTS releases."

### Installing Expo CLI

<TerminalBlock cmd={['# Install the command line tools', 'npm install --global expo-cli']} />

Verify that the installation was successful by running expo whoami. You're not logged in yet, so you will see "Not logged in". You can create an account by running expo register if you like, or if you have one already run expo login, but you also don't need an account to get started.
