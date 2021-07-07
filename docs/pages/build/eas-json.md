---
title: Configuration with eas.json
---

import EasJsonPropertiesTable from '~/components/plugins/EasJsonPropertiesTable';

import androidSchema from '~/scripts/schemas/unversioned/eas-json-android-schema.js';
import iosSchema from '~/scripts/schemas/unversioned/eas-json-ios-schema.js';



`eas.json` is your go-to place for configuring EAS Build. It is located at the root of your project next to your `package.json`. It looks something like this:

```json
{
  "builds": {
    "android": {
      "release": {
        "buildType": "app-bundle"
      },
      "development": {
        "buildType": "development-client",
        "distribution": "internal",
      }
    },
    "ios": {
      "release": {
        "buildType": "release"
      },
      "development": {
        "buildType": "development-client",
        "distribution": "internal"
      }
    }
  }
}
```

The JSON object under the `builds` key contains the platforms that you want to build for. The example above declares that you want to build app binaries for both Android and iOS platforms.

Each object under the platform key can contain multiple build profiles. Every build profile can have an arbitrary name. The default profile that is expected by EAS CLI to exist is `release` (if you'd like to build your app using another build profile you need to specify it with a parameter - `eas build --platform android --profile foobar`). In the example, there are two build profiles (one for Android and one for iOS) and they are both named `release`. However, they could be named `foo` or `bar` or whatever you'd like.

Generally, the schema of this file looks like this:

<!-- prettier-ignore -->
```json
{
  "builds": {
    /* @info valid values: android, ios */"PLATFORM_NAME"/* @end */: {
      /* @info any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_1"/* @end */: { ... },
      /* @info any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_2"/* @end */: { ... },
      ...,
    },
    ...
  }
}
```

where `PLATFORM_NAME` is one of `android` or `ios`.

## Examples

<details>
  <summary>A managed project with several common profiles</summary>

```json
{
  "builds": {
    "android": {
      "base": {
        "image": "default",
        "env": {
          "EXAMPLE_ENV": "example value"
        }
      },
      "release": {
        "extends": "base",
        "env": {
          "ENVIRONMENT": "production"
        },
        "buildType": "app-bundle"
      },
      "staging": {
        "extends": "base",
        "env": {
          "ENVIRONMENT": "staging"
        },
        "distribution": "internal",
        "buildType": "apk"
      },
      "debug": {
        "extends": "base",
        "withoutCredentials": true,
        "env": {
          "ENVIRONMENT": "staging"
        },
        "distribution": "internal",
        "buildType": "development-client"
      }
    },
    "ios": {
      "base": {
        "image": "latest",
        "node": "12.13.0",
        "yarn": "1.22.5"
      },
      "release": {
        "extends": "base",
        "buildType": "release",
        "env": {
          "ENVIRONMENT": "production"
        },
      },
      "inhouse": {
        "extends": "base",
        "distribution": "internal",
        "enterpriseProvisioning": "universal",
        "env": {
          "ENVIRONMENT": "staging"
        }
      },
      "adhoc": {
        "extends": "base",
        "distribution": "internal",
        "env": {
          "ENVIRONMENT": "staging"
        }
      },
      "client": {
        "extends": "adhoc",
        "buildType": "development-client"
      }
    }
  }
}
```
</details>

<details>
  <summary>A bare project with several common profiles</summary>

```json
{
  "builds": {
    "android": {
      "base": {
        "image": "ubuntu-18.04-android-30-ndk-r19c",
        "ndk": "21.4.7075529",
        "env": {
          "EXAMPLE_ENV": "example value"
        }
      },
      "release": {
        "extends": "base",
        "env": {
          "ENVIRONMENT": "production"
        },
        "gradleCommand": ":app:bundleRelease"
      },
      "staging": {
        "extends": "base",
        "env": {
          "ENVIRONMENT": "staging"
        },
        "distribution": "internal",
        "gradleCommand": ":app:assembleRelease"
      },
      "debug": {
        "extends": "base",
        "withoutCredentials": true,
        "env": {
          "ENVIRONMENT": "staging"
        },
        "distribution": "internal",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "ios": {
      "base": {
        "image": "latest",
        "node": "12.13.0",
        "yarn": "1.22.5",
      },
      "release": {
        "extends": "base",
        "schemeBuildConfiguration": "Release",
        "scheme": "testapp",
        "env": {
          "ENVIRONMENT": "production"
        }
      },
      "inhouse": {
        "extends": "base",
        "distribution": "internal",
        "enterpriseProvisioning": "universal",
        "scheme": "testapp-enterprise",
        "env": {
          "ENVIRONMENT": "staging"
        }
      },
      "adhoc": {
        "extends": "base",
        "distribution": "internal",
        "scheme": "testapp",
        "env": {
          "ENVIRONMENT": "staging"
        }
      }
    }
  }
}
```

</details>



## Android

<EasJsonPropertiesTable schema={androidSchema}/>

## iOS

<EasJsonPropertiesTable schema={iosSchema}/>
