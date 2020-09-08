---
title: How to - configuration examples
---

This is set of instructions on how to configure EAS Build for more specific cases than [Configuration with eas.json](../eas-json/) describes. Examples described here, do not provide step by step instructions, in most of the cases they are only referencing differences from the normal process, we are assuming here that user is familiar with the rest of the documentation.

## How to setup EAS build with monorepo

- Run all `eas` commands from root of the react-native project.
- All files like `eas.json`, `credentials.json` should be in root of the react-native project.
- add `postinstall` step to `package.json` in your react-native project that builds all necessary dependecies in other workspaces e.g.

```json
{
  "scripts": {
    "postinstall": "cd ../.. && yarn build",
  }
}
```


## How to use private repositories

- Configure your project in a way that works with `yarn` and relies on `NPM_TOKEN` env to authenticate with private repositories
- add `NPM_TOKEN` env to `secretEnvs` in `credentials.json`
```json
{
  "secretEnvs": {
    "NPM_TOKEN": "example npm token"
  }
}
```

If you are not using `credentials.json` for Android/iOS credentials it can be only entry in that file. Remember to add that file to .gitignore.
