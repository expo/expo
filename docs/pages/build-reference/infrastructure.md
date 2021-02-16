---
title: Build server infrastructure
---

This document describes the current build infrastructure as of December 15, 2020. It is likely to change over time, and this document will be updated.

## Configuring build environment

Images for each platform have one specific version of Node, yarn, CocoaPods, Xcode, Ruby, Fastlane, and so on. You can override some of those values in the [eas.json](../build/eas-json) file or if it's not supported you can use the [hooks mechanism](how-tos/#eas-build-specific-npm-hooks) to install or update any system dependencies with `apt-get` or `brew` before the build starts, but take into account that those customization options are applied during the build and will increase your build times.

When selecting an image for the build you can use the full name provided below or one of the aliases (`default`, `latest`).
- The use of a specific name guarantees a consistent environment with only small updates.
- `default` alias will be assigned to the environment that most closely resembles the configuration used for Expo SDK development.
- `latest` alias will be assigned to the image with the most up to date versions of the software.

Currently, only one image is supported per platform, more images will be available in the future.

## Android build server configurations

- Android workers run on Kubernetes in an isolated environment
  - Every build gets its own container running on a dedicated Kubernetes node
  - Build resources: 4 CPU, 16 GB RAM (14 GB after k8s overhead)
- NPM cache deployed with Kubernetes
- Maven cache deployed with Kubernetes, cached repositories:
  - `maven-central` - [https://repo1.maven.org/maven2/](https://repo1.maven.org/maven2/)
  - `google` - [https://maven.google.com/](https://maven.google.com/)
  - `android-tools` - [https://dl.bintray.com/android/android-tools/](https://dl.bintray.com/android/android-tools/)
  - `jcenter` - [https://jcenter.bintray.com/](https://jcenter.bintray.com/)
  - `plugins` - [https://plugins.gradle.org/m2/](https://plugins.gradle.org/m2/)
- Global gradle configuration in `~/.gradle/gradle.properties`:

  ```jsx
  org.gradle.jvmargs=-Xmx14g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
  org.gradle.parallel=true
  org.gradle.configureondemand=true
  org.gradle.daemon=false
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
- NPM cache

#### Image `macos-catalina-11.15-xcode-12.1` (alias `default`, `latest`)

- macOS Catalina 10.15.4
- Xcode 12.1 (12A7403)
- Node.js 14.15.1
- Yarn 1.22.10
- fastlane 2.170.0
- CocoaPods 1.10.0
- Ruby 2.6.3p62 (2019-04-16 revision 67580) [universal.x86_64-darwin19]
