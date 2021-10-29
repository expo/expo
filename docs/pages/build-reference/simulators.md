---
title: Building for iOS simulators
---

Running a build of your app in an iOS simulator is particularly useful in managed apps to get the standalone (independent of Expo Go) version of the app running easily without needing to deploy to TestFlight or even have an Apple Developer account.

## Configuring a profile to build for simulators

To build your app for installation into an iOS simulator, you can create a new profile in **eas.json** and set the `ios.simulator` value to `true`:

```json
{
  "build": {
    "preview": {
      "ios": {
        "simulator": true
      }
    },
    "production": {}
  }
}
```

Now, to run your build run `eas build -p ios --profile preview`. Remember that you can name the profile whatever you like; we named the profile "preview", but you could call it "simulator", "local", or "simulador" &mdash; whatever makes most sense for you.

## Installing your build on the simulator

> If you haven't installed or run the iOS simulator before, follow the [iOS simulator guide](/workflow/ios-simulator.md) before proceeding.

- Once your build is completed, download the build from the build details page or the link provided when `eas build` is done. This will be a `.tar.gz` file.
- Extract the file by opening it. You will now have a file like `myapp.app`.
- Open up your simulator.
- Drag `myapp.app` into the simulator.
- The app will be installed in a few seconds. When you see it appear on the simulator home screen, tap it to run it.
- You can share this build, it will run in any iOS simulator.
