---
title: Caching dependencies
---

Before a build job can begin compiling your project, all project dependencies need to be available on disk. The longer it takes to acquire the dependencies, the more you need to wait for your build to complete &mdash; so caching dependencies is an important part of speeding up your builds.

> We're actively working on improving caching and other aspects of the build process in order to make builds reliably fast.

## Custom caching

Build profile in [eas.json](../build/eas-json) supports the `cache` field that can be used to configure caching for specific files and directories. Specified files will be uploaded to S3 after successful build and restored after JavaScript dependencies are installed (restoring does not override existing files). Changing the `cache.key` value will invalidate the cache, but any other modification to the `cache` object will also do that.

Caching is implemented on S3 storage, so it's not fast enough to cache `node_modules` or CocoaPods, it's intended only for files that require significant computation to generate, e.g. compilation results (both final binaries and any intermediate files).

## JavaScript dependencies

EAS Build runs an npm cache server that can speed up downloading JavaScript dependencies for your build jobs. It's supported for both platforms, for projects that are using  npm or yarn v2 it will work out of the box, but yarn v1 will require this [workaround](how-tos/#using-npm-cache-with-yarn-v1).

It is not yet possible to save and restore `node_modules` between builds.

## Android dependencies

EAS Build runs a Maven cache server that can speed up downloading Android dependencies for your build jobs.

Currently we are caching:
- `maven-central` - [https://repo1.maven.org/maven2/](https://repo1.maven.org/maven2/)
- `google` - [https://maven.google.com/](https://maven.google.com/)
- `android-tools` - [https://dl.bintray.com/android/android-tools/](https://dl.bintray.com/android/android-tools/)
- `jcenter` - [https://jcenter.bintray.com/](https://jcenter.bintray.com/)
- `plugins` - [https://plugins.gradle.org/m2/](https://plugins.gradle.org/m2/)


## iOS dependencies

There is no caching done for CocoaPods dependencies yet, but we are caching the `Podfile.lock` file.

<br />
