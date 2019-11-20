# Google Maps SDK for iOS

This pod contains the Google Maps SDK for iOS, supporting both Objective C and
Swift.

Use the [Google Maps SDK for iOS](https://developers.google.com/maps/documentation/ios-sdk/)
to enrich your app with interactive maps and immersive street view panoramas,
and add your own custom elements such as markers, windows and polylines.

# Getting Started

*   *Guides*: Read our [Getting Started guides](https://developers.google.com/maps/documentation/ios-sdk/intro).
*   *Demo Videos*: View [pre-recorded online demos](https://developers.google.com/maps/documentation/ios-sdk/#demos).
*   *Code samples*: In order to try out our demo app, use:

    ```
    $ pod try GoogleMaps
    ```

    and follow the instructions on our [developer pages](https://developers.google.com/maps/documentation/ios-sdk/code-samples).

*   *Support*: Find support from various channels and communities.

    *   Support pages for [Google Maps SDK for iOS](https://developers.google.com/maps/documentation/ios-sdk/support).
    *   Stack Overflow, using the [google-maps](https://stackoverflow.com/questions/tagged/google-maps)
        tag.
    *   [Google Maps APIs Premium Plan](https://developers.google.com/maps/premium/support)
        customers have access to business-level support through Google's
        [Enterprise Support Portal](https://google.secure.force.com/).

*   *Report issues*: Use our issue tracker to [file a bug](https://code.google.com/p/gmaps-api-issues/issues/entry?template=Maps%20SDK%20for%20iOS%20-%20Bug)
    or a [feature request](https://code.google.com/p/gmaps-api-issues/issues/entry?template=Maps%20SDK%20for%20iOS%20-%20Feature%20Request).

# Installation

To integrate Google Maps SDK for iOS into your Xcode project using CocoaPods,
specify it in your `Podfile`:

```
source 'https://github.com/CocoaPods/Specs.git'
platform :ios, '9.0'
target 'YOUR_APPLICATION_TARGET_NAME_HERE' do
  pod 'GoogleMaps'
end
```

Then, run the following command:

```
$ pod install
```

Before you can start using the API, you have to activate it in the [Google
Developer Console](https://console.developers.google.com/) and integrate the
respective API key in your project. For detailed installation instructions,
visit Google's Getting Started Guides for the [Google Maps SDK for iOS](https://developers.google.com/maps/documentation/ios-sdk/start).

# Migration from version 1

If you are using the Google Places API for iOS as part of the Google Maps SDK
for iOS version 1 please check the [migration guide](https://developers.google.com/places/migrate-to-v2)
for more information on upgrading your project.

# License and Terms of Service

By using the Google Maps SDK for iOS you accept Google's Terms of Service and
Policies. Pay attention particularly to the following aspects:

*   Depending on your app and use case, you may be required to display
    attribution. Read more about [attribution requirements](https://developers.google.com/maps/documentation/ios-sdk/intro#attribution_requirements).
*   Your API usage is subject to quota limitations. Read more about [usage
    limits](https://developers.google.com/maps/pricing-and-plans/).
*   The [Terms of Service](https://developers.google.com/maps/terms) are a
    comprehensive description of the legal contract that you enter with Google
    by using the Google Maps SDK for iOS. You may want to pay special attention
    to [section 10](https://developers.google.com/maps/terms#10-license-restrictions),
    as it talks in detail about what you can do with the API, and what you
    can't.
