---
title: Build server infrastructure
---

This document describes the current build infrastructure as of December 11, 2020. It is likely to change over time, and this document will be updated.

The software components will become customizable, but they aren't yet. So there is only one version of Node, yarn, CocoaPods, Xcode, Ruby, Fastlane, and so on currently available.

## Common

- node 14.15.1
- yarn 1.22.10

## Android

- one pod per k8s node (gcp n2-standard-2)
  - 2 CPU (gcp unit)
  - 8 GB RAM (with a bit over 6 GB available for build)
- docker image: `ubuntu:bionic-20201119`
- NDK 19.2.5345600
- npm cache deployed inside k8s cluster
- maven cache deployed inside k8s cluster
    - `maven-central` - [https://repo1.maven.org/maven2/](https://repo1.maven.org/maven2/)
    - `google` - [https://maven.google.com/](https://maven.google.com/)
    - `android-tools` - [https://dl.bintray.com/android/android-tools/](https://dl.bintray.com/android/android-tools/)
    - `jcenter` - [https://jcenter.bintray.com/](https://jcenter.bintray.com/)
- global `gradle.properties`:

```jsx
org.gradle.jvmargs=-Xmx6g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=false
```

## iOS

- VMs run on Mac Pro 6.1
    - Intel(R) Xeon(R) CPU E5-2697 (12 core/24 threads) (4 cores per vm)
    - 64 GB RAM (8 GB RAM per worker vm)
- macos-catalina-11.15.4
- xcode-12.1 (12A7403)
- fastlane 2.170.0
- cocoapods 1.10.0
- ruby 2.6.3p62 (2019-04-16 revision 67580) [universal.x86_64-darwin19]
- npm cache (temporary disabled)
