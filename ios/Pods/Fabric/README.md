![Fabric Header](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-fabric-header.png)

# Fabric

## Overview

[Fabric](https://get.fabric.io) provides developers with the tools they need to build the best apps. Developed and maintained by Google and the team that built Crashlytics, Fabric provides an easy way to manage all your SDKs so that you’ll never have to worry about tedious configurations or juggling different accounts. We let you get right into coding and building the next big app.

For a full list of SDK provided through Fabric visit [https://fabric.io/kits](https://fabric.io/kits).

## Setup

The Fabric Pod is a dependency for all Fabric SDKs and is included when installing any Fabric related Pods. General setup instructions are shown below; however, these vary depending on the selected SDK.

1. Visit [https://fabric.io/sign_up](https://fabric.io/sign_up) to create your Fabric account and to download Fabric.app.

1. Open Fabric.app, login and select an SDK to install.

    ![Fabric Plugin](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-fabric-plugin.png)

1. The Fabric app automatically detects when a project uses CocoaPods and gives you the option to install via the Podfile or Xcode.

	![Fabric Installation Options](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-pod-installation-option.png)

1. Select the Podfile option and follow the installation instructions to update your Podfile. Note: the example below is for the Crashlytics SDK. The instructions will vary based on the selected SDK.

	![Fabric Podfile Instructions](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-podfile-instructions.png)

1. Add a Run Script Build Phase and build your app.

	![Fabric Run Script Build Phase](https://docs.fabric.io/ios/cocoapod-readmes/cocoapods-rsbp.png)

1. Initialize the SDK by inserting code outlined in Fabric.app.

1. Run your app to finish the installation.

## Resources

* [Documentation](https://docs.fabric.io/)
* [Forums](https://stackoverflow.com/questions/tagged/google-fabric)
* [Website](https://get.fabric.io)
* Follow us on Twitter: [@fabric](https://twitter.com/fabric)
