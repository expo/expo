![Crashlytics Header](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-crashlytics-header.png)

Part of [Google Fabric](https://get.fabric.io), [Crashlytics](http://try.crashlytics.com/) offers the most powerful, yet lightest weight crash reporting solution for iOS. Crashlytics also provides real-time analytics through [Answers](https://answers.io/) and app distributions to testers using [Beta](http://try.crashlytics.com/beta/).

## Setup

1. Visit [https://fabric.io/sign_up](https://fabric.io/sign_up) to create your Fabric account and to download Fabric.app.

1. Open Fabric.app, login and select the Crashlytics SDK.

    ![Fabric Plugin](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-fabric-plugin.png)

1. The Fabric app automatically detects when a project uses CocoaPods and gives you the option to install via the Podfile or Xcode.

	![Fabric Installation Options](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-pod-installation-option.png)

1. Select the Podfile option and follow the installation instructions to update your Podfile. **Note:** the Crashlytics Pod includes Answers. If you have Answers included as a separate Pod it should be removed from your Podfile to avoid duplicate symbol errors.

	```
	pod 'Fabric'
	pod 'Crashlytics'
	```

1. Run `pod install`

1. Add a Run Script Build Phase and build your app.

	![Fabric Run Script Build Phase](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-rsbp.png)

1. Initialize the SDK by inserting code outlined in the Fabric.app.

1. Run your app to finish the installation.

## Resources

* [Documentation](https://docs.fabric.io/apple/crashlytics/overview.html)
* [Forums](https://stackoverflow.com/questions/tagged/google-fabric)
* [Website](http://try.crashlytics.com/)
* Follow us on Twitter: [@fabric](https://twitter.com/fabric) and [@crashlytics](https://twitter.com/crashlytics)
