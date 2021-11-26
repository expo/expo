---
name: '🐛 Bug Report'
about: Report a reproducible bug or regression in this library.
---

NB Never post screenshots of code. Post copy paste-able code if you include any.
Ignoring this will likely lead to direct closing of the issue.
Please respect the time and energy of open source maintainers.

# Bug

Please provide a clear and concise description of what the bug is.
Include screenshots if needed.
Please test using the latest release of the library, as maybe said bug has been already fixed.

#### Unexpected behavior

If you have unexpected behavior, please create a clean project with the latest versions of react-native and react-native-svg

```bash
react-native init CleanProject
cd CleanProject/
yarn add react-native-svg
cd ios && pod install && cd ..
modify App.js -> run the app
```

If it's still an issue with the latest versions,
please make an sscce in the clean project,
and make it available as a git repo on github.
Or as a https://snack.expo.io/ if expo has the latest version,
and / or the bug exists both in the latest version and the one used in expo and snack.

## Environment info

Run `react-native info` in your terminal and copy the results here. Also, include the *precise* version number of this library that you are using in the project


React native info output:

```bash
 // paste it here
```

Library version: x.x.x

## Steps To Reproduce

Issues without reproduction steps or code are likely to stall.

1. git clone https://github.com/user/rnsvg-bug-repro
2. cd rnsvg-bug-repro
3. yarn
4. yarn ios
5. yarn android
6. ...

Describe what you expected to happen:

1.
2.

## Short, Self Contained, Correct (Compilable), Example

If you are having a problem with some code and seeking help, preparing a Short, Self Contained, Correct Example (SSCCE) is very useful. But what is an SSCCE?

It is all in the name, really. Take a look at each part. The version prepared for others to see should be:

Short (Small) - Minimise bandwidth for the example, do not bore the audience.
Self Contained - Ensure everything is included, ready to go.
Correct - Copy, paste, (compile,) see is the aim.
Example - Displays the problem we are trying to solve.

http://www.sscce.org/
