---
title: Caching dependencies
---

Before a build job can begin compiling your project, all project dependencies need to be available on disk. The longer it takes to acquire the dependencies, the more you need to wait for your build to complete &mdash; so caching dependencies is an important part of speeding up your builds.

> We're actively working on improving caching and other aspects of the build process in order to make builds reliably fast.

## Custom caching

The `cache` field on build profiles in [eas.json](../build/eas-json) can be used to configure caching for specific files and directories. Specified files will be saved to persistent storage after a successful build and restored on subsequent builds after the JavaScript dependencies are installed. Restoring does not overwrite existing files. Changing the `cache.key` value will invalidate the cache. Changing any other property of the `cache` object will also invalidate the cache.

The caching implementation is built on top of Amazon S3, and it's not fast enough to give you any benefit from caching `node_modules` or CocoaPods; it's intended only for files that require significant computation to generate, e.g. compilation results (both final binaries and any intermediate files).

## JavaScript dependencies

EAS Build runs an npm cache server that can speed up downloading JavaScript dependencies for your build jobs. Projects that are using npm or yarn v2 will use the cache by default, but yarn v1 will require that you apply this [workaround](how-tos/#using-npm-cache-with-yarn-v1).

It is not yet possible to save and restore `node_modules` between builds.

## Android dependencies

EAS Build runs a Maven cache server that can speed up downloading Android dependencies for your build jobs.

Currently we are caching:
- `maven-central` - [https://repo1.maven.org/maven2/](https://repo1.maven.org/maven2/)
- `google` - [https://maven.google.com/](https://maven.google.com/)
- `jcenter` - [https://jcenter.bintray.com/](https://jcenter.bintray.com/)
- `plugins` - [https://plugins.gradle.org/m2/](https://plugins.gradle.org/m2/)


## iOS dependencies

There is no caching done for CocoaPods dependencies yet, only the `Podfile.lock` file is cached (in order to provide consistent results across managed app builds).
