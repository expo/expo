---
title: Integrating with third-party tooling
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

This document outlines how to configure EAS Build for some common scenarios, such as monorepos and repositories with private dependencies. The examples described here do not provide step-by-step instructions to set up EAS Build from scratch. Instead, they explain the changes from the standard process that are necessary to accommodate the given scenario.

## EAS Build-specific npm hooks

There are three EAS Build-specific npm hooks that you can set in your package.json. See the [Android build process](android-builds.md) and [iOS build process](ios-builds.md) docs to get a better understanding about the internals of the build process.

- `eas-build-pre-install` - executed before EAS Build runs `yarn install`
- `eas-build-post-install` - the behavior depends on the platform:
  - for Android, after `yarn install` has completed
  - for iOS, after `yarn install` and `pod install` have completed
- `eas-build-pre-upload-artifacts` - this hook is triggered almost at the end of the build process, just before EAS Build uploads the build artifacts to AWS S3

This is an example of how your package.json might look like:

```json
{
  "main": "index.js",
  "scripts": {
    "eas-build-pre-install": "echo 123",
    "eas-build-post-install": "echo 456",
    "eas-build-pre-upload-artifacts": "echo 789",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "start": "react-native start",
    "test": "jest"
  },
  "dependencies": {
    "expo": "~40.0.0"
    // ...
  },
  "devDependencies": {
    // ...
  },
  "jest": {
    "preset": "react-native"
  },
  "private": true
}
```

## How to set up EAS Build with a monorepo

- Run all EAS CLI commands from the root of the app directory. For example: if your project exists inside of your git repository at `apps/my-app`, then run `eas build` from there.
- All files related to EAS Build, such as **eas.json** and **credentials.json**, should be in the root of the app directory. If you have multiple apps that use EAS Build in your monorepo, each app directory will have its own copy of these files.
- **If you are building a managed project in a monorepo**, please refer to [byCedric/eas-monorepo-example](https://github.com/byCedric/eas-monorepo-example) for a working example. You will need to set up [symlinks with expo-yarn-workspaces](https://github.com/byCedric/eas-monorepo-example/blob/dc62206a23f591923a38c0c6ea5d94b84ede6df4/apps/managed/package.json#L45-L63) in order to ensure that Expo module packages can be resolved. A better solution for this is in progress and should be available by SDK 43.
- If your project needs additional setup beyond what is provided, add a `postinstall` step to **package.json** in your project that builds all necessary dependencies in other workspaces. For example:

```json
{
  "scripts": {
    "postinstall": "cd ../.. && yarn build"
  }
}
```

## How to use private package repositories

See [Using private npm packages](/build-reference/private-npm-packages) to learn more.

## Using npm cache with yarn v1

By default the EAS npm cache won't work with yarn v1, because `yarn.lock` files contain URLs to registries for every package and yarn does not provide any way to override it. The issue is fixed in yarn v2, but the yarn team does not plan to backport it to yarn v1. If you want to take advantage of the npm cache, you can use the `eas-build-pre-install` script to override the registry in your `yarn.lock`.

e.g.

```
{
 "scripts": {
    "eas-build-pre-install": "bash -c \"[ ! -z \\\"EAS_BUILD_NPM_CACHE_URL\\\" ] && sed -i -e \\\"s#https://registry.yarnpkg.com#$EAS_BUILD_NPM_CACHE_URL#g\\\" yarn.lock\""
  }
}
```

## How to use git submodules

If you are using the default VCS workflow, the content of your working directory will be uploaded to EAS Build as it is, including the content of Git submodules. If you are building on CI you will need to initialize them, otherwise, empty directories will be uploaded.

If you have `cli.requireCommit` set to `true` in `eas.json` you will need to initialize your submodules on EAS Build worker.
First, create a [secret](/build-reference/variables/#using-secrets-in-environment-variables) with a base64 encoded private SSH key that has permission to access submodule repositories. Next, add an `eas-build-pre-install` npm hook to check out those submodules, for example:

```bash
#!/usr/bin/env bash

mkdir -p ~/.ssh

# Real origin URl is lost during the packaging process, so if your
# submodules are defined using relative urls in .gitmodules then
# you need to restore it with:
#
# git remote set-url origin git@github.com:example/repo.git

# restore private key from env variable and generate public key
echo "$SSH_KEY_BASE64" | base64 -d > ~/.ssh/id_rsa
chmod 0600 ~/.ssh/id_rsa
ssh-keygen -y -f ~/.ssh/id_rsa > ~/.ssh/id_rsa.pub

# add your git provider to the list of known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

git submodule update --init
```
