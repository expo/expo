---
title: Caching dependencies
---

Before a build job can begin compiling your project, all project dependencies need to be available on disk. The longer it takes to acquire the dependencies, the more you need to wait for your build to complete &mdash; so caching dependencies is an important part of speeding up your builds.

> We're actively working on improving caching and other aspects of the build process in order to make builds reliably fast.

## JavaScript dependencies

EAS Build runs an npm cache server that can speed up downloading JavaScript dependencies for your build jobs. This is currently only available to Android build jobs, but support for iOS build jobs is coming soon.

It is not yet possible to save and restore `node_modules` between builds.

## Android dependencies

EAS Build runs a Maven cache server that can speed up downloading Android dependencies for your build jobs.

## iOS dependencies

There is no caching done for CocoaPods dependencies yet.

<br />