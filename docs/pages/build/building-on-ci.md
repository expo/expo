---
title: EAS builds with CI
---

This document outlines how to trigger builds on EAS for your app from a CI environment.

## Configuring the app

To trigger EAS builds from a CI environment, we first need to configure our app with EAS Build and make sure we can trigger builds from our local machine.
To automatically configure your native project for building with EAS Build on Android and iOS, you will need to run the following command in the root of your project:

```sh
expo eas:build:init
```

See [EAS Build from scratch in 5 minutes](eas-build-in-5-minutes.md) for a detailed explanation and examples of what this does.

## Triggering builds

Before building with EAS on CI, we need to install and configure `expo-cli`. Then, we can trigger new builds with the `eas:build` command.

### Prepare Expo CLI

To interact with the Expo API, we need to install Expo CLI. You can use an environment with this library preinstalled, or you can add it to the project as a development dependency.

The latter is the easiest way, but may increase the installation time.
For vendors that charge you per minute, it might we worth creating a prebuilt environment.

To install Expo CLI in your project, run:

```sh
npm install --save-dev expo-cli
```

### Prepare authentication

Next, we need to authenticate as the owner of the app. This is possible by storing a personal access token in the `EXPO_TOKEN` environment variable in the CI settings.

See [the guide for personal access tokens](https://docs.expo.io/accounts/personal/#personal-access-tokens) to learn how to create access tokens.

### Trigger new builds

Now that we're authenticated with Expo CLI, we can create the build step.

To trigger new builds, we will add this script to our configuration:

```sh
npx expo eas:build --platform all --non-interactive
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
    - stage: deploy
      node_js: lts/*
      script:
        - npm ci
        - npx expo eas:build --platform all --non-interactive
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
    - npx expo eas:build --platform all --non-interactive
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
          - npx expo eas:build --platform all --non-interactive
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
      - image: circleci/node:10
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
          command: npx expo-cli eas:build --platform all --non-interactive

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
          node-version: 10.x

      - name: Setup Expo
        uses: expo/expo-github-action@v5
        with:
          expo-version: 3.x
          expo-token: ${{ secrets.EXPO_TOKEN }}
          expo-cache: true

      - name: Install dependencies
        run: npm ci

      - name: Build on EAS
        run: expo eas:build --platform all --non-interactive
```

> Put this into `.github/workflows/eas-build.yml` in the root of your repository.

</p>
</details>
