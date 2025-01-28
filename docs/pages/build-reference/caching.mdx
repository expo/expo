---
title: Cache dependencies
description: Learn how to speed up your builds by caching dependencies.
---

Before a build job can begin compiling your project, all project dependencies need to be available on disk. The longer it takes to acquire the dependencies, the more you need to wait for your build to complete &mdash; so caching dependencies is an important part of speeding up your builds.

> We're actively working on improving caching and other aspects of the build process to make builds reliably fast.

## Custom caching

The `cache` field on build profiles in [eas.json](/build/eas-json) can be used to configure caching for specific files and directories. Specified files will be saved to persistent storage after a successful build and restored on subsequent builds after the JavaScript dependencies are installed. Restoring does not overwrite existing files. Changing the `cache.key` value will invalidate the cache. Changing any other property of the `cache` object will also invalidate the cache.

## JavaScript dependencies

EAS Build runs an npm cache server that can speed up downloading JavaScript dependencies for your build jobs. By default, projects using npm or Yarn 2+ will use the cache. However, Yarn 1 (Classic) requires that you apply this [workaround](/build-reference/npm-cache-with-yarn) to use the cache in your project's **package.json**.

To disable using our npm cache server for your builds set the `EAS_BUILD_DISABLE_NPM_CACHE` env variable value to `"1"` in **eas.json**.

{/* prettier-ignore */}
```json eas.json
{
  "build": {
    "production": {
      "env": {
        "EAS_BUILD_DISABLE_NPM_CACHE": "1"
        /* @hide ... */ /* @end */
      }
      /* @hide ... */ /* @end */
    }
    /* @hide ... */ /* @end */
  }
  /* @hide ... */ /* @end */
}
```

## Android dependencies

EAS Build runs a Maven cache server that can speed up downloading Android dependencies for your build jobs.

Currently, we are caching:

- `maven-central` - [https://repo1.maven.org/maven2/](https://repo1.maven.org/maven2/)
- `google` - [https://maven.google.com/](https://maven.google.com/)
- `jcenter` - [https://jcenter.bintray.com/](https://jcenter.bintray.com/)
- `plugins` - [https://plugins.gradle.org/m2/](https://plugins.gradle.org/m2/)

To disable using our Maven cache server for your builds set the `EAS_BUILD_DISABLE_MAVEN_CACHE` env variable value to `"1"` in **eas.json**.

{/* prettier-ignore */}
```json eas.json
{
  "build": {
    "production": {
      "env": {
        "EAS_BUILD_DISABLE_MAVEN_CACHE": "1"
        /* @hide ... */ /* @end */
      }
      /* @hide ... */ /* @end */
    }
    /* @hide ... */ /* @end */
  }
  /* @hide ... */ /* @end */
}
```

## iOS dependencies

EAS Build serves most CocoaPods artifacts from a cache server. This improves the consistency of `pod install` times and generally improves speed. The cache will be bypassed automatically if you provide your own **.netrc** or **.curlrc** files.

To disable using our CocoaPods cache server for your builds set the `EAS_BUILD_DISABLE_COCOAPODS_CACHE` env variable value to `"1"` in **eas.json**.

{/* prettier-ignore */}
```json eas.json
{
  "build": {
    "production": {
      "env": {
        "EAS_BUILD_DISABLE_COCOAPODS_CACHE": "1"
        /* @hide ... */ /* @end */
      }
      /* @hide ... */ /* @end */
    }
    /* @hide ... */ /* @end */
  }
  /* @hide ... */ /* @end */
}
```

It is typical to not have your project **Podfile.lock** committed to source control when using [prebuild](/workflow/prebuild) to generate your **ios** directory [remotely at build time](/build-reference/ios-builds).
It can be useful to cache your **Podfile.lock** to have deterministic builds, but the tradeoff in this case is that, because you don't use the lockfile during local development, your ability to determine when a change is needed and to update specific dependencies is limited.
If you cache this file, you may occasionally end up with build errors that require clearing the cache.
To cache **Podfile.lock**, add **./ios/Podfile.lock** to the `cache.paths` list in your build profile in **eas.json**.

{/* prettier-ignore */}
```json eas.json
{
  "build": {
    "production": {
      "cache": {
        "paths": ["./ios/Podfile.lock"]
        /* @hide ... */ /* @end */
      }
      /* @hide ... */ /* @end */
    }
    /* @hide ... */ /* @end */
  }
  /* @hide ... */ /* @end */
}
```
