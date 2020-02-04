# Firebase JS & Native SDK comparison

| Module        | JS (RN) | Web | iOS | Android | Singleton/Multi | Notes                                                                                                                            |
| ------------- | ------- | --- | --- | ------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ads           | ❌       | ❌   | ✅   | ✅       | S               | Google Mobile Ads (admob)                                                                                                        |
| analytics     | 💥*     | ✅   | ✅   | ✅       | S               | * requires DOM functions                                                                                                         |
| ├ abtesting   | ❌       | ❌   | ✅   | ❌       |                 |                                                                                                                                  |
| └ measurement | ❌       | ❌   | ❌   | ✅       |                 |                                                                                                                                  |
| app           | ✅       | ✅   | ✅   | ✅       | M               |                                                                                                                                  |
| appindexing   | ❌       | ❌   | ❌   | ✅       | ?               | Lets apps index personal content and log user actions with Google                                                                |
| auth          | ✅       | ✅   | ✅   | ✅       | M               |                                                                                                                                  |
| ├ apple       | ✅       | ✅   | ✅   | ✅       |                 | = Generic OAuth                                                                                                                  |
| ├ email       | ✅       | ✅   | ✅   | ✅       |                 |                                                                                                                                  |
| ├ facebook    | ✅       | ✅   | ✅   | ✅       |                 |                                                                                                                                  |
| ├ gamecenter  | ❌       | ❌   | ✅   | ❌       |                 | Apple Gamecenter                                                                                                                 |
| ├ gamesserver | ❌       | ❌   | ❌   | ✅       |                 | Google Play Games                                                                                                                |
| ├ github      | ✅       | ✅   | ✅   | ✅       |                 |                                                                                                                                  |
| ├ google      | ✅       | ✅   | ✅   | ✅       |                 |                                                                                                                                  |
| ├ oauth       | ✅       | ✅   | ✅   | ✅       |                 |                                                                                                                                  |
| ├ phone       | ✅       | ✅   | ✅   | ✅       |                 |                                                                                                                                  |
| └ twitter     | ✅       | ✅   | ✅   | ✅       |                 |                                                                                                                                  |
| crashlytics   | ✅       | ❌   | ✅   | ✅       | S               |                                                                                                                                  |
| database      | ✅       | ✅   | ✅   | ✅       | M               |                                                                                                                                  |
| └ persistence | 💥*     | ✅   | ✅   | ✅       |                 | * requires IndexedDB                                                                                                             |
| dynamiclinks  | ❌       | ❌   | ✅   | ✅       | S               |                                                                                                                                  |
| firestore     | ✅       | ✅   | ✅   | ✅       | M               |                                                                                                                                  |
| └ persistence | 💥*     | ✅   | ✅   | ✅       |                 | * requires IndexedDB                                                                                                             |
| functions     | ✅       | ✅   | ✅   | ✅       | M               |                                                                                                                                  |
| installations | ❌       | ✅   | ✅   | ❌       | M               | Provides identifiers, authentication scheme, and GDPR deletion for installations of Firebase applications                        |
| instanceid    | ❌       | ❌   | ✅   | ✅       | S               | Provides a unique id for each app instance and a mechanism to authenticate and authorize actions (example: sending FCM messages) |
| ml            | ❌       | ❌   | ✅   | ✅       | M               | Machine learning, vision, naturallanguage, custom                                                                                |
| messaging     | ❌       | ✅   | ✅   | ✅       | S               |                                                                                                                                  |
| └ inapp       | ❌       | ❌   | ✅   | ✅       |                 |                                                                                                                                  |
| performance   | ✅       | ✅   | ✅   | ✅       | S               |                                                                                                                                  |
| remoteconfig  | 💥*     | ✅   | ✅   | ✅       | M               | * requires IndexedDB                                                                                                             |
| storage       | ✅       | ✅   | ✅   | ✅       | M               |                                                                                                                                  |
