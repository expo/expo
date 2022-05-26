---
title: iOS App Extensions
---

App extensions let you extend custom functionality and content beyond your app and make it available to users while they’re interacting with other apps or the system.

## Bare project

When you build a bare project EAS CLI will automatically detect app extensions configured in your Xcode project and generate all necessary credentials for each target, or you can provide them in `credentials.json` ([Learn more](../../app-signing/local-credentials/#multi-target-project)).

## Managed projects (experimental support)

In a standard managed project we have only one application target without any extensions, but with introduction of [config plugins](../../guides/config-plugins) it became possible to create new targets on the fly. When EAS Build worker is executing `expo prebuild` a new Xcode targets can be added to the project, but at that point it is to late to generate credentials for them, so we need a way to declare earlier what targets will be exist during build.

To declare new target add in your **app.json**:

```json
{
  "expo": {
    ...
    "extra": {
      "eas": {
        "build": {
          "experimental": {
            "ios": {
              "appExtensions": [
                {
                  "targetName": "myappextension",
                  "bundleIdentifier": "com.myapp.extension",
                  "entitlements": {
                    "com.apple.example": "entitlement value"
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
```

> Note: This is just an example of a configuration, but in most cases above target info should be added as part of the config plugin.
