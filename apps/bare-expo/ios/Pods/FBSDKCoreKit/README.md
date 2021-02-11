# Facebook SDK for iOS

[![Platforms](https://img.shields.io/cocoapods/p/FBSDKCoreKit.svg)](https://cocoapods.org/pods/FBSDKCoreKit)
[![circleci](https://circleci.com/gh/facebook/facebook-ios-sdk/tree/master.svg?style=shield)](https://circleci.com/gh/facebook/facebook-ios-sdk/tree/master)

[![CocoaPods](https://img.shields.io/cocoapods/v/FBSDKCoreKit.svg)](https://cocoapods.org/pods/FBSDKCoreKit)
[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)

This open-source library allows you to integrate Facebook into your iOS app.

Learn more about the provided samples, documentation, integrating the SDK into your app, accessing source code, and more
at https://developers.facebook.com/docs/ios

Please take a moment and [subscribe to releases](https://docs.github.com/en/enterprise/2.15/user/articles/watching-and-unwatching-repositories) so that you can be notified about new features, deprecations, and critical fixes. To see information about the latest release, consult our [changelog](CHANGELOG.md).


## TRY IT OUT

### Swift Package Manager (available Xcode 11.2 and forward)

1. In Xcode, select File > Swift Packages > Add Package Dependency.
2. Follow the prompts using the URL for this repository and a minimum semantic version of v5.10.0
3. Check-out the tutorials available online at: <https://developers.facebook.com/docs/ios/getting-started>
4. Start coding! Visit <https://developers.facebook.com/docs/ios> for tutorials and reference documentation.

**Note for Swift Package Manager Users:**

If you explicitly **DO NOT** want to include Swift, import `FBSDKCoreKit` `FBSDKLoginKit` and `FBSDKShareKit`
</br>For projects that include Swift, use `FacebookCore`, `FacebookLogin`, and `FacebookShare`

### CocoaPods

1. Add the following to your `Podfile`:

        pod 'FBSDKCoreKit'
        pod 'FBSDKLoginKit'
        pod 'FBSDKShareKit'

2. Test your install by adding `import FBSDKCoreKit` to your `AppDelegate`
3. Check-out the tutorials available online at: <https://developers.facebook.com/docs/ios/getting-started>
4. Start coding! Visit <https://developers.facebook.com/docs/ios> for tutorials and reference documentation.

## iOS 14 CHANGES

### Data Disclosure

Due to the release of iOS 14, tracking events that your app collects and sends to Facebook may require you to disclosed these data types in the App Store Connect questionnaire. It is your responsibility to ensure this is reflected in your application’s privacy policy. Visit our blogpost for information on affected Facebook SDKs, APIs, and products and the Apple App Store Privacy Details article to learn more about the data types you will need to disclose.

link to FB blogpost https://developers.facebook.com/blog/post/2020/10/22/preparing-for-apple-app-store-data-disclosure-requirements/

apple store details https://developer.apple.com/app-store/app-privacy-details/

## FEATURES

- Login - <https://developers.facebook.com/docs/facebook-login>
- Sharing - <https://developers.facebook.com/docs/sharing>
- App Links - <https://developers.facebook.com/docs/applinks>
- Graph API - <https://developers.facebook.com/docs/ios/graph>
- Analytics - <https://developers.facebook.com/docs/analytics>

## GIVE FEEDBACK

Please report bugs or issues to our designated developer support team -- <https://developers.facebook.com/support/bugs/> -- as this will help us resolve them more quickly.

You can also visit our [Facebook Developer Community Forum](https://developers.facebook.com/community/),
join the [Facebook Developers Group on Facebook](https://www.facebook.com/groups/fbdevelopers/),
ask questions on [Stack Overflow](http://facebook.stackoverflow.com),
or open an issue in this repository.

## LICENSE

See the [LICENSE](LICENSE) file.

## SECURITY POLICY

See the [SECURITY POLICY](SECURITY.md) for more info on our bug bounty program.

## DEVELOPER TERMS

- By enabling Facebook integrations, including through this SDK, you can share information with Facebook, including
  information about people’s use of your app. Facebook will use information received in accordance with our
  [Data Use Policy](https://www.facebook.com/about/privacy/), including to provide you with insights about the
  effectiveness of your ads and the use of your app. These integrations also enable us and our partners to serve ads on
  and off Facebook.
- You may limit your sharing of information with us by updating the Insights control in the developer tool
  `https://developers.facebook.com/apps/{app_id}/settings/advanced`.
- If you use a Facebook integration, including to share information with us, you agree and confirm that you have
  provided appropriate and sufficiently prominent notice to and obtained the appropriate consent from your users
  regarding such collection, use, and disclosure (including, at a minimum, through your privacy policy). You further
  agree that you will not share information with us about children under the age of 13.
- You agree to comply with all applicable laws and regulations and also agree to our Terms
  <https://www.facebook.com/policies/>, including our Platform Policies <https://developers.facebook.com/policy/>.and
  Advertising Guidelines, as applicable <https://www.facebook.com/ad_guidelines.php>.

By using the Facebook SDK for iOS you agree to these terms.
