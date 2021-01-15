---
title: Building iOS Locally
---

import InstallSection from '~/components/plugins/InstallSection';

import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';


> ⚠️ An macOS machine and an Apple Developer account are required to build the development client locally. 

## Building for iOS

You can build your app for yourself or a simulator using XCode.

If you have not done this before, you'll need to:
- download [XCode](https://apps.apple.com/us/app/xcode/id497799835)
- generate your first build on [a simulator](https://developer.apple.com/documentation/xcode/running_your_app_in_the_simulator_or_on_a_device) or [device](https://www.twilio.com/blog/2018/07/how-to-test-your-ios-application-on-a-real-device.html).


## Distributing development clients to other developers

### For simulators

After running the command, the generated app will be named **MyApp.app** and can be found under `ios/build/Release-iphonesimulator/`

You can transfer the app folder via email, shared network directory, or however you would transfer an arbitrary file. You may want to compress the `app/` folder to facilitate the transfer.

After launching your simulator, you can simply drag the `app/` folder from your file explorer onto the running simulator to install it.

If you would prefer to install via the command line you can do so via `xcrun simctl install booted [path to .app folder]`

### For physical devices

You'll need to use Testflight to give other developers builds of your development client.

You can follow [this tutorial](https://www.raywenderlich.com/10868372-testflight-tutorial-ios-beta-testing) to get started.
