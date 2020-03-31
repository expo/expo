# Expo Payments

This screen may not be usable outside of the `bare-expo` project, which is preconfigured for supporting in-app purchases.

To use this in a new project, you'll first need to add some purchases in [App Store Connect](https://appstoreconnect.apple.com/)
and [Google Play Console](https://developer.android.com/distribute/console/) respectively.

There are already a few basic in-app products configured there (one for each type).
If you need to change their details or add more you can do so there, just make sure you have permissions to view/edit the app entry.

## Setup

In order to test purchasing you'll need to set up a [sandbox account](https://help.apple.com/app-store-connect/#/dev8b997bee1) for iOS
and opt in as a [beta tester](https://developer.android.com/google/play/billing/billing_testing) on Android.
This will allow you to make unlimited fake purchases without getting charged real money.
