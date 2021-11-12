---
title: Triggering builds from CI
---

import { InlineCode } from '~/components/base/code';

This document outlines how to trigger builds on EAS for your app from a CI environment such as GitHub Actions.

Before building with EAS on CI, we need to install and configure `eas-cli`. Then, we can trigger new builds with the `eas build` command.

## Prerequisites

### Run a successful build from your local machine

To trigger EAS builds from a CI environment, we first need to configure our app for EAS Build and successfully run a build from our local machine for each platform that we'd like to support on CI.

If you have run `eas build -p [all|ios|android]` successfully before, then you can continue.

If you haven't done this yet, please refer to the [Creating your first build](setup.md) guide and return here when you're ready.

<details><summary><strong>Are you using the classic build system?</strong> (<InlineCode>expo build:[android|ios]</InlineCode>)</summary> <p>

Learn how to [build standalone apps on your CI with our classic build service](/classic/turtle-cli.md).

</p>
</details>

## Configure your app for CI

<!-- We can probably leave this out -- users can figure out on their own if they want to do this or use npx -->
<!-- ### Make EAS CLI available in your CI environment

To interact with the EAS API, we need to install EAS CLI. You can use an environment with this library preinstalled, or you can add it to the project as a development dependency.

The latter is the easiest way, but may increase the installation time.
For vendors that charge you per minute, it might we worth creating a prebuilt environment.

To install EAS CLI in your project, run:

```sh
npm install --save-dev eas-cli
```

> 💡 Make sure to update this dependency frequently to stay up to date with the EAS API interface. -->

### Provide a personal access token to authenticate with your Expo account on CI

Next, we need to ensure that we can authenticate ourselves on CI as the owner of the app. This is possible by storing a personal access token in the `EXPO_TOKEN` environment variable in the CI settings.

See [the guide for personal access tokens](/accounts/programmatic-access.md#personal-account-personal-access-tokens) to learn how to create access tokens.

### Trigger new builds

Now that we're authenticated with Expo CLI, we can create the build step.

To trigger new builds, we will add this script to our configuration:

```sh
npx eas-cli build --platform all --non-interactive
```

This will trigger a new build on EAS and print the URLs for the built files after the build completes.

<details><summary>Travis CI</summary>
<p>

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

</p>
</details>

<details><summary>Gitlab CI</summary>
<p>

```yaml
image: node:alpine

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - ~/.npm

stages:
  - build

before_script:
  - npm ci

eas-build:
  stage: build
  script:
    - apk add --no-cache bash
    - npx eas-cli build --platform all --non-interactive
```

> Put this into `.gitlab-ci.yml` in the root of your repository.

</p>
</details>

<details><summary>Bitbucket Pipelines</summary>
<p>

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

</p>
</details>

<details><summary>CircleCI</summary>
<p>

```yaml
version: 2.1

executors:
  default:
    docker:
      - image: circleci/node:16
    working_directory: ~/my-app

commands:
  attach_project:
    steps:
      - attach_workspace:
          at: ~/my-app

jobs:
  eas_build:
    executor: default
    steps:
      - checkout
      - attach_project

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

</p>
</details>

<details><summary>GitHub Actions</summary>
<p>

```yaml
name: EAS Build
on:
  push:
    branches:
      - master
  workflow_dispatch:

jobs:
  build:
    name: Install and build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: 16.x

      - name: Setup Expo
        uses: expo/expo-github-action@v5
        with:
          expo-version: 4.x
          expo-token: ${{ secrets.EXPO_TOKEN }}
          expo-cache: true

      - name: Install dependencies
        run: npm ci

      - name: Build on EAS
        run: npx eas-cli build --platform all --non-interactive
```

> Put this into `.github/workflows/eas-build.yml` in the root of your repository.

</p>
</details>
