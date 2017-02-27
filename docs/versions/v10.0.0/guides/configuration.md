---
title: Configuration with exp.json
old_permalink: /versions/v10.0.0/guides/configuration.html
previous___FILE: ./development-mode.md
next___FILE: ./logging.md
---

`exp.json` is your go-to place for configuring parts of your app that don't belong in code. The following is a full list of properties available to you.

-   `name`  
    **Required**. The name of your app as it appears both within Expo and on your home screen as a standalone app.

-   `description`  
    A short description of what your app is and why it is great.

-   `slug`  
    **Required**. The friendly url name for publishing. eg: `exp.host/@your-username/slug`.

-   `sdkVersion`  
    **Required**. The Expo sdkVersion to run the project on. This should line up with the version specified in your package.json.

-   `version`  
    Your app version, use whatever versioning scheme that you like.

-   `orientation`  
    Lock your app to a specific orientation with `portrait` or `landscape`. Defaults to no lock. default, portrait, landscape

-   `primaryColor`  
    On Android, this will determine the color of your app in the multitasker. Currently this is not used on iOS, but it may be used for other purposes in the future. 6 character long hex color string, eg: `'#000000'`

-   `iconUrl`  
    A url that points to your app's icon image. We recommend that you use a 512x512 png file with transparency. This icon will appear on the home screen and within the Expo app.

-   `notification`  
    Configuration for remote (push) notifications.

    -   `iconUrl`  
        Url that points to the icon to use for push notifications. 48x48 png grayscale with transparency.

    -   `color`  
        Tint color for the push notification image when it appears in the notification tray. 6 character long hex color string, eg: `'#000000'`

    -   `androidMode`  
        Show each push notification individually (`default`) or collapse into one (`collapse`). default, collapse

    -   `androidCollapsedTitle`  
         If `androidMode` is set to `collapse`, this title is used for the collapsed notification message. eg: `'#{unread_notifications} new interactions'`.

-   `loading`  
    Configuration for the loading screen that users see when opening your app, while fetching & caching bundle and assets.

    -   `iconUrl`  
        Url that points to the icon to display while starting up the app. Image size and aspect ratio are up to you. Must be a .png.

    -   `exponentIconColor`  
        If no icon is provided, we will show the Expo logo. You can choose between `white` and `blue`. white, blue

    -   `exponentIconGrayscale`  
        Similar to `exponentIconColor` but instead indicate if it should be grayscale (`1`) or not (`0`).

    -   `backgroundImageUrl`  
        Url that points to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.

    -   `backgroundColor`  
        Color to fill the loading screen background 6 character long hex color string, eg: `'#000000'`

    -   `hideExponentText`  
        By default, Expo shows some text at the bottom of the loading screen. Set this to `true` to disable.

-   `appKey`  
    By default, Expo looks for the application registered with the AppRegistry as `main`. If you would like to change this, you can specify the name in this property.

-   `androidStatusBarColor`  
    6 character long hex color string, eg: `'#000000'`

-   `androidHideExponentNotificationInShellApp`  
    By default, Expo adds a notification to your app with refresh button and debug info. Set this to `true` to disable.

-   `scheme`  
    **Standalone Apps Only**. Url scheme to link into your app. For example, if we set this to `'rnplay'`, then rnplay:// urls would open your app when tapped.

-   `entryPoint`  
    The relative path to your main JavaScript file.

-   `extra`  
    Any extra fields you want to pass to your experience.

-   `rnCliPath`  

-   `packagerOpts`  

-   `ignoreNodeModulesValidation`  

-   `nodeModulesPath`  

-   `ios`  
    **Standalone Apps Only**. iOS standalone app specific configuration

    -   `bundleIdentifier`  
        The bundle identifier for your iOS standalone app. You make it up, but it needs to be unique on the App Store. See [this StackOverflow question](http://stackoverflow.com/questions/11347470/what-does-bundle-identifier-mean-in-the-ios-project). Reverse DNS notation unique name for your app. For example, host.exp.exponent, where exp.host is our domain and Expo is our app.

-   `config`  

    -   `fabric`  
        [Twitter Fabric](https://get.fabric.io/) keys to hook up Crashlytics and other services.

    -   `apiKey`  
        Your Fabric API key

    -   `buildSecret`  
        Your Fabric build secret

-   `android`  
    **Standalone Apps Only**. Android standalone app specific configuration

    -   `package`  
        The package name for your Android standalone app. You make it up, but it needs to be unique on the Play Store. See [this StackOverflow question](http://stackoverflow.com/questions/6273892/android-package-name-convention). Reverse DNS notation unique name for your app. For example, host.exp.exponent, where exp.host is our domain and Expo is our app.

    -   `versionCode`  
        Version number required by Google Play. Increment by one for each release. <https://developer.android.com/studio/publish/versioning.html>.

    -   `config`  

        -   `fabric`  
            [Twitter Fabric](https://get.fabric.io/) keys to hook up Crashlytics and other services.

        -   `apiKey`  
            Your Fabric API key

        -   `buildSecret`  
            Your Fabric build secret

        -   `googleMaps`  
            [Google Maps Android SDK](https://developers.google.com/maps/documentation/android-api/signup) key for your standalone app.

            -   `apiKey`  
                Your Google Maps Android SDK API key
