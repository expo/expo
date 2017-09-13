---
title: Payments
---

## Adding the Payments Module on iOS

The Payments module is currently only supported through ExpoKit on iOS (to understand why, refer to [Why ExpoKit on iOS?](#why-expokit-on-ios?)).

First, detach your Expo project using ExpoKit (refer to [Detach to ExpoKit]('../guides/detach.md') for more information). Then, navigate to and open `your-project-name/ios/Podfile`. Add "Payments" to your Podfile's subspecs. Example:

```ruby

...
target 'your-project-name' do
  pod 'ExpoKit',
    :git => "https://github.com/expo/expo.git",
    :subspecs => [
      "Core",
      "CPP", # Add a comma here!
      "Payments" # Add this line here!
    ]

  pod 'React',
  ...

```

Finally, make sure [CocoaPods](https://cocoapods.org/) is installed and run `pod install` in `your-project-name/ios`. This will add the Payments module files to your project and the corresponding dependencies.

## Why ExpoKit on iOS?

Expo previously included support for a native Payments API without ExpoKit. We learned that apple sometimes rejects apps which contain the Stripe SDK but don’t offer anything for sale. To help your App Review process go more smoothly, we’ve decided to remove the Stripe SDK and experimental Payments API from apps built with the Expo standalone builder. We’re still excited to give developers a way to let users pay for goods when they need to and we’ll announce ways to do so shortly.
