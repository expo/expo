# expo-payments-stripe

Provides support for payments through Stripe and Apple Pay on iOS (in bare apps), and Stripe on Android (plus Android Pay with bare apps).

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/payments.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/payments/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/payments/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-payments-stripe
```

- Include the config plugin in your `app.config.js` or `app.json`. Add the following props:
  - `scheme` is the redirect URI that's used for returning to the app after an external payment. This should not match one of your existing schemes as it'll redirect to a special Activity on Android.
  - `merchantId` is an Apple ID that's required for making payments. This value should match the `merchantId` property used with `setOptionsAsync({ ... })` in your React code.
    - List all of your existing IDs here: [View IDs](https://developer.apple.com/account/resources/identifiers/list/merchant)
    - Or create a new merchant ID here: [Create ID](https://developer.apple.com/account/resources/identifiers/add/merchant)

```json
{
  "plugins": [
    [
      "expo-payments-stripe",
      {
        "scheme": "your-redirect-uri",
        "merchantId": "merchant.<com.example.development>"
      }
    ]
  ]
}
```

- Regenerate the native folders with `expo eject`
- Build the project with `yarn ios` and `yarn android`

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
