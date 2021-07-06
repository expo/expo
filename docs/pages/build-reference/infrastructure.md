---
title: Build server infrastructure
sidebar_title: Server infrastructure
---

This document describes the current build infrastructure as of December 15, 2020. It is likely to change over time, and this document will be updated.

## Configuring build environment

Images for each platform have one specific version of Node, yarn, CocoaPods, Xcode, Ruby, Fastlane, and so on. You can override some of those values in the [eas.json](../build/eas-json) file or if it's not supported you can use the [hooks mechanism](how-tos/#eas-build-specific-npm-hooks) to install or update any system dependencies with `apt-get` or `brew` before the build starts, but take into account that those customization options are applied during the build and will increase your build times.

When selecting an image for the build you can use the full name provided below or one of the aliases (`default`, `latest`).
- The use of a specific name guarantees a consistent environment with only small updates.
- `default` alias will be assigned to the environment that most closely resembles the configuration used for Expo SDK development.
- `latest` alias will be assigned to the image with the most up to date versions of the software.

## Android build server configurations

- Android workers run on Kubernetes in an isolated environment
  - Every build gets its own container running on a dedicated Kubernetes node
  - Build resources: 4 CPU, 16 GB RAM (14 GB after k8s overhead)
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



#### Image `ubuntu-18.04-android-30-ndk-r19c` (alias `default`, `latest`)

- Docker image: `ubuntu:bionic-20201119`
- NDK 19.2.5345600
- Node.js 14.15.1
- Yarn 1.22.10

## iOS build server configurations

- iOS worker VMs run on Macs Pro 6.1 in an isolated environment
  - Every build gets its own fresh macOS VM
  - Hardware: Intel(R) Xeon(R) CPU E5-2697 (12 core/24 threads), 64 GB RAM
  - Build resource limits: 6 cores, 8 GB RAM
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

#### Image `macos-big-sur-11.4-xcode-12.5` (alias `default`, `latest`)

- macOS Big Sur 11.4
- Xcode 12.5 (12E5244e)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.185.1
- CocoaPods 1.10.1
- Ruby 2.7.0p0 (2019-12-25 revision 647ee6f091) [x86_64-darwin19]

#### Image `macos-catalina-10.15-xcode-12.4`

- macOS Catalina 10.15.7
- Xcode 12.4 (12D4e)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.178.0
- CocoaPods 1.10.1
- Ruby 2.7.0p0 (2019-12-25 revision 647ee6f091) [x86_64-darwin19]

#### Image `macos-catalina-10.15-xcode-12.1`

- macOS Catalina 10.15.4
- Xcode 12.1 (12A7403)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.170.0
- CocoaPods 1.10.1
- Ruby 2.6.3p62 (2019-04-16 revision 67580) [universal.x86_64-darwin19]
