---
title: Build server infrastructure
sidebar_title: Server infrastructure
---

This document describes the current build infrastructure as of October 8, 2021. It is likely to change over time, and this document will be updated.

## Configuring build environment

Images for each platform have one specific version of Node, yarn, CocoaPods, Xcode, Ruby, Fastlane, and so on. You can override some of the versions in [eas.json](../build/eas-json). If there's no dedicated configuration option you're looking for, you can use [npm hooks](how-tos/#eas-build-specific-npm-hooks) to install or update any system dependencies with `apt-get` or `brew`. Please take into account that those customizations are applied during the build and will increase your build times.

When selecting an image for the build you can use the full name provided below or one of the aliases: `default`, `latest`.

- The use of a specific name guarantees the consistent environment with only minor updates.
- `default` alias will be assigned to the environment that most closely resembles the configuration used for Expo SDK development.
- `latest` alias will be assigned to the image with the most up to date versions of the software.

> **Note:** If you don't provide `image` in eas.json, your build is going to use the `default` image. There is one exception to this rule - if you have a managed project and you don't specify `image`, it will be chosen based on your Expo SDK version. E.g. SDKs 41 and lower use `macos-catalina-10.15-xcode-12.1`, SDK 42 uses `macos-big-sur-11.4-xcode-12.5`, and SDK 43 uses `macos-big-sur-11.4-xcode-13.0`.

## Android build server configurations

- Android workers run on Kubernetes in an isolated environment
  - Every build gets its own container running on a dedicated Kubernetes node
  - Build resources: 4 CPU, 12 GB RAM
- npm cache deployed with Kubernetes. [Learn more](caching/#javascript-dependencies)
- Maven cache deployed with Kubernetes. [Learn more](caching/#android-dependencies)
- Global gradle configuration in `~/.gradle/gradle.properties`:

  ```jsx
  org.gradle.jvmargs=-Xmx14g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
  org.gradle.parallel=true
  org.gradle.configureondemand=true
  org.gradle.daemon=false
  ```

- `~/.npmrc`

  ```
  user=0
  unsafe-perm=true
  registry=http://npm-cache-service.worker-infra-production.svc.cluster.local:4873
  ```

- `~/.yarnrc.yml`

  ```
  unsafeHttpWhitelist:
    - "*"
  npmRegistryServer: "http://npm-cache-service.worker-infra-production.svc.cluster.local:4873"
  ```

#### Image `ubuntu-20.04-android-30-ndk-r21e` (alias `latest`)

<details><summary>Details</summary>

- Docker image: `ubuntu:focal-20210921`
- NDK 21.4.7075529
- Node.js 14.15.1
- Yarn 1.22.10

</details>

#### Image `ubuntu-18.04-android-30-ndk-r19c` (alias `default`)

<details><summary>Details</summary>

- Docker image: `ubuntu:bionic-20210930`
- NDK 19.2.5345600
- Node.js 14.15.1
- Yarn 1.22.10

</details>

## iOS build server configurations

- iOS worker VMs run on Macs Pro 6.1 in an isolated environment
  - Every build gets its own fresh macOS VM
  - Hardware: Intel(R) Xeon(R) CPU E5-2697 (12 core/24 threads), 64 GB RAM
  - Build resource limits: 6 cores, 12 GB RAM
- npm cache. [Learn more](caching/#javascript-dependencies)
- `~/.npmrc`

  ```
  registry=http://10.254.24.8:4873
  ```

- `~/.yarnrc.yml`

  ```
  unsafeHttpWhitelist:
    - "*"
  npmRegistryServer: "registry=http://10.254.24.8:4873"
  ```

#### Image `macos-big-sur-11.4-xcode-13.0` (alias `latest`)

<details><summary>Details</summary>

- macOS Big Sur 11.4
- Xcode 13.0 (13A233)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.185.1
- CocoaPods 1.10.1
- Ruby 2.7

</details>

#### Image `macos-big-sur-11.4-xcode-12.5` (alias `default`)

<details><summary>Details</summary>

- macOS Big Sur 11.4
- Xcode 12.5 (12E5244e)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.185.1
- CocoaPods 1.10.1
- Ruby 2.7

</details>

#### Image `macos-catalina-10.15-xcode-12.4`

<details><summary>Details</summary>

- macOS Catalina 10.15.7
- Xcode 12.4 (12D4e)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.178.0
- CocoaPods 1.10.1
- Ruby 2.7

</details>

#### Image `macos-catalina-10.15-xcode-12.1`

<details><summary>Details</summary>

- macOS Catalina 10.15.4
- Xcode 12.1 (12A7403)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.170.0
- CocoaPods 1.10.1
- Ruby 2.6.3p62

</details>
