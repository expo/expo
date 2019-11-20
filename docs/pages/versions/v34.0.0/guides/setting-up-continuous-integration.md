---
title: Setting up Continuous Integration
---

Continuous Integration (CI) and Continuous Delivery (CD) are concepts which can help you to build and deploy with confidence.
It's the idea of automating as much as you can, like running tests or creating new releases.

CI/CD is a relatively broad idea and can get as complex as you can make it.
In this guide, we will create a basic setup for testing (CI) and deployments (CD).
Also, the configuration for Bitbucket Pipelines, Gitlab CI, and Travis CI are provided.
Other CI/CD vendors can be used too; everything is executable through CLI.

## Test with Jest

Testing is an essential part of an average CI workflow.
This process gives you the confidence when shipping by running all automated tests on every relevant change.
Without this, you can't be sure if a proposed change breaks the expected behavior of any existing functionality.

Before we can run the tests, we need to install the dependencies. You can use yarn, npm-install or even the faster npm-ci command.
After this, we can run the tests with Jest. Unfortunately, we can't use the original npm-test script shipped with expo-cli.
This script is designed to start a daemon that watches for file changes and reruns the tests.
In CI environments we need Jest to run the tests once and exit with a (un)successful status code.
Also, it's also a good idea to explicitly tell Jest it is running in a CI environment.
Jest will handle snapshots more strictly.

To summarize we will set up the CI to run the following two scripts.

```bash
$ npm ci
$ npx jest --ci
```

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
script:
  - npm ci
  - npx jest --ci
```

> Put this into `.travis.yml` in the root of your repository.

<center>
	<a href="https://travis-ci.com/byCedric/expo-guide-ci/builds/79027881" target="_blank">See it in action</a>
</center>

</p>
</details>

<details><summary>Gitlab CI</summary>
<p>

```yaml
---
image: node:alpine
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - ~/.npm
stages:
  - test
before_script:
  - npm ci
jest-tests:
  stage: test
  script:
    - npx jest --ci
```

> Put this into `.gitlab-ci.yml` in the root of your repository.

<center>
	<a href="https://gitlab.com/byCedric/expo-guide-ci/pipelines/25800111" target="_blank">See it in action</a>
</center>

</p>
</details>

<details><summary>Bitbucket Pipelines</summary>
<p>

```yaml
---
image: node:alpine
definitions:
  caches:
    npm: ~/.npm
pipelines:
  default:
    - step:
        name: Test with Jest
        caches:
          - npm
        script:
          - npm ci
          - npx jest --ci
```

> Put this into `bitbucket-pipelines.yml` in the root of your repository.

<center>
	<a href="https://bitbucket.org/byCedric/expo-guide-ci/addon/pipelines/home#!/results/2" target="_blank">See it in action</a>
</center>

</p>
</details>

### Improving Jest performance

As you might have noticed already, the tests in CI are a bit slower compared to running them locally.
It's slower because your hardware is more powerful than the CI hardware.
Jest can leverage the use of parallel testing with such equipment.
Also, Some vendors limit the hardware resources or offer "premium" services for more power.
Luckily there is a relatively easy way to improve the speed of Jest; using the power of caching.

There is no definitive way of telling how much it improves.
Using the expo-cli tabs project as an example, it can speed up by a factor of 4x - 5x.

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
    - .jest
before_script:
  - npm install -g npm@latest
script:
  - npm ci
  - npx jest --ci
```

> Put this into `.travis.yml` in the root of your repository.

<center>
	<a href="https://travis-ci.com/byCedric/expo-guide-ci/builds/79027970" target="_blank">See it in action</a>
</center>

</p>
</details>

<details><summary>Gitlab CI</summary>
<p>

```yaml
---
image: node:alpine
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - ~/.npm
    - .jest
stages:
  - test
before_script:
  - npm ci
jest-tests:
  stage: test
  script:
    - npx jest --ci
```

> Put this into `.gitlab-ci.yml` in the root of your repository.

<center>
	<a href="https://gitlab.com/byCedric/expo-guide-ci/pipelines/25800165" target="_blank">See it in action</a>
</center>

</p>
</details>

<details><summary>Bitbucket Pipelines</summary>
<p>

```yaml
---
image: node:alpine
definitions:
  caches:
    npm: ~/.npm
    jest: .jest
pipelines:
  default:
    - step:
        name: Test with Jest
        caches:
          - npm
          - jest
        script:
          - npm ci
          - npx jest --ci
```

> Put this into `bitbucket-pipelines.yml` in the root of your repository.

<center>
	<a href="https://bitbucket.org/byCedric/expo-guide-ci/addon/pipelines/home#!/results/3" target="_blank">See it in action</a>
</center>

</p>
</details>

## Deploy to Expo

Now that we have a proper CI workflow in place, we will focus on the Continuous Deployment (CD) part.
In this process, we will make a new build and push it to Expo.
Combined with Over The Air (OTA) updates, this can create a simple but effective CD infrastructure.
Just like the CI part, we first need to install the dependencies.
After this, we need to authenticate at Expo and "publish" a new build.

### Prepare Expo CLI

To interact with the Expo API, we need to install the Expo CLI.
You can use an environment with this library preinstalled, or you can add it to the project as a development dependency.
The latter is the easiest way but might increase the installation time.
For vendors that charge you per minute, it might we worth creating a prebuilt environment.

To install the Expo CLI into your project, you can execute this script.

```bash
$ npm install --save-dev expo-cli
```

### Prepare authentication

Next, we will configure the publishing step of your application to Expo.
Before we can do this, we need to authenticate as the owner of the app.
This is possible by storing the username or email with the password in the environment.
Every vendor has implemented their storage mechanism for sensitive data like passwords, although they are very similar.
Most vendors make use of environment variables which are "injected" into the environment and scrubbed from the logs to keep it safe.

To perform the authentication, we will add this script to our configuration:

```bash
$ npx expo login -u <EXPO USERNAME> -p <EXPO PASSWORD>
```

If you don't want to expose the password in the login script, set the `EXPO_CLI_PASSWORD` environment variable to the password and run the following script instead:

```bash
$ npx expo login --non-interactive -u <EXPO USERNAME>
```

### Publish new builds

After having the CLI library and authentication in place, we can finally create the build step.
In this step, we will create a new build and send it to Expo.
It finalizes the whole workflow of creating, testing and shipping your application.

To create the builds, we will add this script to our configuration:

```bash
$ npx expo publish --non-interactive
```

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
    - .jest
before_script:
  - npm install -g npm@latest
script:
  - npm ci
  - npx jest --ci
jobs:
  include:
    - stage: deploy
      node_js: lts/*
      script:
        - npm ci
        - npx expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD
        - npx expo publish --non-interactive
```

> Put this into `.travis.yml` in the root of your repository.

<center>
	<a href="https://travis-ci.com/byCedric/expo-guide-ci/builds/79032797" target="_blank">See it in action</a>
</center>

</p>
</details>

<details><summary>Gitlab CI</summary>
<p>

```yaml
---
image: node:alpine
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - ~/.npm
    - .jest
stages:
  - test
  - deploy
before_script:
  - npm ci
jest-tests:
  stage: test
  script:
    - npx jest --ci
expo-deployments:
  stage: deploy
  script:
    - apk add --no-cache bash
    - npx expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD
    - npx expo publish --non-interactive
```

> Put this into `.gitlab-ci.yml` in the root of your repository.

<center>
	<a href="https://gitlab.com/byCedric/expo-guide-ci/pipelines/25806602" target="_blank">See it in action</a>
</center>

</p>
</details>

<details><summary>Bitbucket Pipelines</summary>
<p>

```yaml
---
image: node:alpine
definitions:
  caches:
    npm: ~/.npm
    jest: .jest
pipelines:
  default:
    - step:
        name: Test with Jest
        caches:
          - npm
          - jest
        script:
          - npm ci
          - npx jest --ci
    - step:
        name: Deploy to Expo
        deployment: test
        caches:
          - npm
        script:
          - apk add --no-cache bash
          - npm ci
          - npx expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD
          - npx expo publish --non-interactive
```

> Put this into `bitbucket-pipelines.yml` in the root of your repository.

<center>
	<a href="https://bitbucket.org/byCedric/expo-guide-ci/addon/pipelines/home#!/results/11" target="_blank">See it in action</a>
</center>

</p>
</details>

<details><summary>CircleCI</summary>
<p>

```yaml
---
version: 2
publish: &publish
  working_directory: ~/my-app
  docker:
    - image: circleci/node:10.4.1
  steps:
    - checkout

    - run:
        name: Installing dependencies
        command: npm install

    - run:
        name: Login into Expo
        command: npx expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD

    - run:
        name: Publish to Expo
        command: npx expo publish --non-interactive --max-workers 1 --release-channel $EXPO_RELEASE_CHANNEL

jobs:
  publish_to_expo_dev:
    environment:
      EXPO_RELEASE_CHANNEL: dev
    <<: *publish

  publish_to_expo_prod:
    environment:
      EXPO_RELEASE_CHANNEL: default
    <<: *publish

workflows:
  version: 2
  my_app:
    jobs:
      - publish_to_expo_dev:
          filters:
            branches:
              only: development
      - publish_to_expo_prod:
          filters:
            branches:
              only: master
```

> Put this into `.circleci/config.yml` in the root of your repository.

</p>
</details>

## Next steps

CI and CD are concepts which are far from fully covered in this guide.
The best thing you can do to get familiar with these subjects is to make stuff yourself.
Here are some extra links that might help you further.

### Useful subjects

- [Release channels](../../distribution/release-channels/)
- [Building standalone apps](../../distribution/building-standalone-apps/)
- [Configuring OTA Updates](../configuring-ota-updates/)

### Official documentation CI/CD vendors

- [Gitlab CI](https://docs.gitlab.com/ce/ci/)
- [Travis CI](https://docs.travis-ci.com/)
- [Bitbucket Pipelines](https://confluence.atlassian.com/bitbucket/build-test-and-deploy-with-pipelines-792496469.html)

### Extra tutorials

- [Setting up Expo and Bitbucket Pipelines](https://blog.expo.io/setting-up-expo-and-bitbucket-pipelines-8995ef036a18)

### Example repositories from this guide

- [Github](https://github.com/bycedric/expo-guide-ci)
- [Gitlab](https://gitlab.com/byCedric/expo-guide-ci)
- [Bitbucket](https://bitbucket.org/byCedric/expo-guide-ci)
