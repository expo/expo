# expo-firebase-core

Great new module!

# API documentation

# Installation in managed Expo projects

# Installation in bare React Native projects

# Contributing


# Firebase JS & Native SDK comparison

| Module        | JS (RN) | Web | iOS | Android | Notes                                                                                                                            |
| ------------- | ------- | --- | --- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ads           | ❌       | ❌   | ✅   | ✅       | Google Mobile Ads (admob)                                                                                                        |
| analytics     | 💥*     | ✅   | ✅   | ✅       | * requires DOM functions                                                                                                         |
| ├ abtesting   | ❌       | ❌   | ✅   | ❌       |                                                                                                                                  |
| └ measurement | ❌       | ❌   | ❌   | ✅       |                                                                                                                                  |
| app           | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| appindexing   | ❌       | ❌   | ❌   | ✅       | Lets apps index personal content and log user actions with Google                                                                |
| auth          | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| ├ apple       | ✅       | ✅   | ✅   | ✅       | = Generic OAuth                                                                                                                  |
| ├ email       | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| ├ facebook    | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| ├ gamecenter  | ❌       | ❌   | ✅   | ❌       | Apple Gamecenter                                                                                                                 |
| ├ gamesserver | ❌       | ❌   | ❌   | ✅       | Google Play Games                                                                                                                |
| ├ github      | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| ├ google      | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| ├ oauth       | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| ├ phone       | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| └ twitter     | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| crashlytics   | ✅       | ❌   | ✅   | ✅       |                                                                                                                                  |
| database      | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| └ persistence | 💥*     | ✅   | ✅   | ✅       | * requires IndexedDB                                                                                                             |
| dynamiclinks  | ❌       | ❌   | ✅   | ✅       |                                                                                                                                  |
| firestore     | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| └ persistence | 💥*     | ✅   | ✅   | ✅       | * requires IndexedDB                                                                                                             |
| functions     | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| installations | ❌       | ✅   | ✅   | ❌       | Provides identifiers, authentication scheme, and GDPR deletion for installations of Firebase applications                        |
| instanceid    | ❌       | ❌   | ✅   | ✅       | Provides a unique id for each app instance and a mechanism to authenticate and authorize actions (example: sending FCM messages) |
| ml            | ❌       | ❌   | ✅   | ✅       | Machine learning, vision, naturallanguage, custom                                                                                |
| messaging     | ❌       | ✅   | ✅   | ✅       |                                                                                                                                  |
| └ inapp       | ❌       | ❌   | ✅   | ✅       |                                                                                                                                  |
| performance   | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
| remoteconfig  | 💥*     | ✅   | ✅   | ✅       | * requires IndexedDB                                                                                                             |
| storage       | ✅       | ✅   | ✅   | ✅       |                                                                                                                                  |
