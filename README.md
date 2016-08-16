# Exponent [![Slack](http://slack.exponentjs.com/badge.svg)](http://slack.exponentjs.com)

This is the Exponent app used to view experiences published to the Exponent service.

## Set Up

- `npm install` in the `js` and `tools-public` directories.
- Install [the Gulp CLI](http://gulpjs.com/) globally: `npm i gulp-cli -g`.
- Run the packager with `cd tools-public && gulp`. Leave this running while you run the clients.

### Android
- Build and install Android with `cd android && ./run.sh && cd ..`.

### iOS
- Install [Cocoapods](https://cocoapods.org/): `gem install cocoapods --no-ri --no-rdoc`.
- `cd tools-public && ./generate-files-ios.sh && cd ..`.
- `cd ios && pod install && cd ..`.
- Run iOS project by opening `ios/Exponent.xcworkspace` in Xcode.

## Project Layout

- `android` contains the Android project.
- `ios/Exponent.xcworkspace` is the Xcode workspace. Always open this instead of `Exponent.xcodeproj` because the workspace also loads the CocoaPods dependencies.
- `ios` contains the iOS project.
- `ios/Podfile` specifies the CocoaPods dependencies of the app.
- `js` contains the JavaScript source code of the app.
- `tools-public` contains programs to launch the packager and also build tools.

## Contributing
Please check with us before putting work into a Pull Request! The best place to talk to us is on
Slack at https://slack.exponentjs.com/.
