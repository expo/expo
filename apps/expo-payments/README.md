## Expo Payments

This is an ejected Expo app that can be used to test the `expo-in-app-purchases` module.

It has a bundle ID of `dev.expo.Payments` and an application ID of `com.expo.payments`.
This is important because it matches the app entries we set up in [App Store Connect](https://appstoreconnect.apple.com/)
and [Google Play Console](https://developer.android.com/distribute/console/) respectively.

There are already a few basic in-app products configured there (one for each type).
If you need to change their details or add more you can do so there, just make sure you have permissions to view/edit the app entry.

### Setup
In order to test purchasing you'll need to set up a [sandbox account](https://help.apple.com/app-store-connect/#/dev8b997bee1) for iOS
and opt in as a [beta tester](https://developer.android.com/google/play/billing/billing_testing) on Android.
This will allow you to make unlimited fake purchases without getting charged real money.

### How to Run
1. Run `yarn`
2. Run `pod install` in the `ios/` directory
3. Run `expo start` to start up the app
4. Build the client using Xcode and Android Studio
5. Test the API and update the app by modifying `App.js`
