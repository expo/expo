---
title: "How to: configuration examples"
---

This document outlines how to configure EAS Build for some common scenarios, such as monorepos and private package repositories. The examples described here do not provide step by step instructions to set up EAS Build from scratch; instead, they explain the changes from the standard process that are necessary to acommodate the given scenario.

## How to set up EAS Build with a monorepo

- Run all `eas` commands from root of the app directory. For example: if your project exists inside of your git repository at `apps/my-app`, then run `expo eas:build` from there.
- All files related to EAS Build, such as `eas.json` and `credentials.json`, should be in the root of the app directory. If you have multiple apps that use EAS Build in your monorepo, each app directory will have its own copy of these files.
- If your project needs additional setup beyond what is provided Add a `postinstall` step to `package.json` in your project that builds all necessary dependecies in other workspaces. For example:

```json
{
  "scripts": {
    "postinstall": "cd ../.. && yarn build",
  }
}
```

## How to use private package repositories

- Configure your project in a way that works with `yarn` and relies on the `NPM_TOKEN` env to authenticate with private repositories
- add `experimental.npmToken` in `credentials.json`
```json
{
  "experimental": {
    "npmToken": "example npm token"
  }
}
```

If you are not using `credentials.json` for Android/iOS credentials, it is fine for `secretEnvs` to be the only entry in the file. Add `credentials.json` to `.gitignore` if it's not there already.
