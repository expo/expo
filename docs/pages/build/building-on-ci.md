---
title: Triggering builds from CI
---

import { ConfigClassic } from '~/components/plugins/ConfigSection';
import { InlineCode } from '~/components/base/code';
import { Collapsible } from '~/ui/components/Collapsible';

This document outlines how to trigger builds on EAS for your app from a CI environment such as GitHub Actions.

Before building with EAS on CI, we need to install and configure `eas-cli`. Then, we can trigger new builds with the `eas build` command.

## Prerequisites

### Run a successful build from your local machine

To trigger EAS builds from a CI environment, we first need to configure our app for EAS Build and successfully run a build from our local machine for each platform that we'd like to support on CI.

If you have run `eas build -p [all|ios|android]` successfully before, then you can continue.

If you haven't done this yet, please refer to the [Creating your first build](setup.md) guide and return here when you're ready.

<ConfigClassic>

Learn how to [build standalone apps on your CI with our classic build service](/archive/classic-updates/turtle-cli.md).

</ConfigClassic>

## Configure your app for CI

{/* We can probably leave this out -- users can figure out on their own if they want to do this or use npx */}
{/* ### Make EAS CLI available in your CI environment

To interact with the EAS API, we need to install EAS CLI. You can use an environment with this library preinstalled, or you can add it to the project as a development dependency.

The latter is the easiest way, but may increase the installation time.
For vendors that charge you per minute, it might we worth creating a prebuilt environment.

To install EAS CLI in your project, run:

```sh
npm install --save-dev eas-cli
```

> 💡 Make sure to update this dependency frequently to stay up to date with the EAS API interface. */}

### Provide a personal access token to authenticate with your Expo account on CI

Next, we need to ensure that we can authenticate ourselves on CI as the owner of the app. This is possible by storing a personal access token in the `EXPO_TOKEN` environment variable in the CI settings.

See [the guide for personal access tokens](/accounts/programmatic-access.md#personal-account-personal-access-tokens) to learn how to create access tokens.

### (Optional) Provide an ASC Api Token for your Apple Team

In the event your iOS credentials need to be repaired, we will need an ASC API key to authenticate ourselves to Apple in CI. A common case is when your provisioning profile needs to be re-signed.

You will need to create an [API Key](https://expo.fyi/creating-asc-api-key). Next, you will need to gather information about your [Apple Team](https://expo.fyi/apple-team).

Using the information you've gathered, pass it into the build command through environment variables. You will need to pass in the following:

- `EXPO_ASC_API_KEY_PATH`: the path to your ASC API Key .p8 file, e.g. /path/to/key/AuthKey_SFB993FB5F.p8
- `EXPO_ASC_KEY_ID`: the key ID of your ASC API Key, e.g. SFB993FB5F.
- `EXPO_ASC_ISSUER_ID`: the issuer ID of your ASC API Key, e.g. f9675cff-f45d-4116-bd2c-2372142cee09.
- `EXPO_APPLE_TEAM_ID`: your Apple Team ID, e.g. 77KQ969CHE.
- `EXPO_APPLE_TEAM_TYPE`: your Apple Team Type. Valid types are `IN_HOUSE`, `COMPANY_OR_ORGANIZATION`, or `INDIVIDUAL`.

### Trigger new builds

Now that we're authenticated with Expo CLI, we can create the build step.

To trigger new builds, we will add this script to our configuration:

```sh
npx eas-cli build --platform all --non-interactive
```

This will trigger a new build on EAS and print the URLs for the built files after the build completes.

<Collapsible summary="Travis CI">

```yaml
---
language: node_js
node_js:
  - node
  - lts/*
cache:
  directories:
    - ~/.npm
before_script:
  - npm install -g npm@latest

jobs:
  include:
    - stage: build
      node_js: lts/*
      script:
        - npm ci
        - npx eas-cli build --platform all --non-interactive
```

> Put this into `.travis.yml` in the root of your repository.

</Collapsible>

<Collapsible summary="GitLab CI">

```yaml
image: node:alpine

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .npm
    # or with yarn:
    #- .yarn

stages:
  - build

before_script:
  - npm ci --cache .npm
  # or with yarn:
  #- yarn install --cache-folder .yarn

eas-build:
  stage: build
  script:
    - apk add --no-cache bash
    - npx eas-cli build --platform all --non-interactive
```

> Put this into `.gitlab-ci.yml` in the root of your repository.

</Collapsible>

<Collapsible summary="Bitbucket Pipelines">

```yaml
image: node:alpine

definitions:
  caches:
    npm: ~/.npm

pipelines:
  default:
    - step:
        name: Build app
        deployment: test
        caches:
          - npm
        script:
          - apk add --no-cache bash
          - npm ci
          - npx eas-cli build --platform all --non-interactive
```

> Put this into `bitbucket-pipelines.yml` in the root of your repository.

</Collapsible>

<Collapsible summary="CircleCI">

```yaml
version: 2.1

executors:
  default:
    docker:
      - image: cimg/node:lts
    working_directory: ~/my-app

jobs:
  eas_build:
    executor: default
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: npm ci
      - run:
          name: Trigger build
          command: npx eas-cli build --platform all --non-interactive

workflows:
  build_app:
    jobs:
      - eas_build:
          filters:
            branches:
              only: master
```

> Put this into `.circleci/config.yml` in the root of your repository.

</Collapsible>

<Collapsible summary="GitHub Actions">

```yaml
name: EAS Build
on:
  workflow_dispatch:
  push:
    branches:
      - master
jobs:
  build:
    name: Install and build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16.x
          cache: npm
      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v7
        with:
          expo-version: 5.x
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Install dependencies
        run: npm ci
      - name: Build on EAS
        run: eas build --platform all --non-interactive
```

> Put this into `.github/workflows/eas-build.yml` in the root of your repository.

</Collapsible>
