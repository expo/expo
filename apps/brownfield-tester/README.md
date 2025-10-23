# Brownfield Tester App

This is a sample application used to test brownfield integration with Expo modules.
It uses the "integrated" approach to load JS code of the `minimal-tester` app by configuring a custom project root.

## iOS App

The iOS app was initialized by creating a new SwiftUI project in Xcode 26 and following the [Brownfield Integration](https://docs.expo.dev/brownfield/get-started/) guide to integrate Expo modules. As a final step, due to Swift 6 not being totally supported yet it was necessary to set "Default Actor isolation" to "nonisolated" in the project settings.
