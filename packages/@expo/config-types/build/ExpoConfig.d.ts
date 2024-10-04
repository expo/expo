/**
 * The standard Expo config object defined in `app.config.js` files.
 */
export interface ExpoConfig {
    /**
     * The name of your app as it appears both within Expo Go and on your home screen as a standalone app.
     */
    name: string;
    /**
     * A short description of what your app is and why it is great.
     */
    description?: string;
    /**
     * The friendly URL name for publishing. For example, `myAppName` will refer to the `expo.dev/@project-owner/myAppName` project.
     */
    slug: string;
    /**
     * The name of the Expo account that owns the project. This is useful for teams collaborating on a project. If not provided, the owner defaults to the username of the current user.
     */
    owner?: string;
    /**
     * The auto generated Expo account name and slug used for display purposes. It is not meant to be set directly. Formatted like `@username/slug`. When unauthenticated, the username is `@anonymous`. For published projects, this value may change when a project is transferred between accounts or renamed.
     */
    currentFullName?: string;
    /**
     * The auto generated Expo account name and slug used for services like Notifications and AuthSession proxy. It is not meant to be set directly. Formatted like `@username/slug`. When unauthenticated, the username is `@anonymous`. For published projects, this value will not change when a project is transferred between accounts or renamed.
     */
    originalFullName?: string;
    /**
     * Defaults to `unlisted`. `unlisted` hides the project from search results. `hidden` restricts access to the project page to only the owner and other users that have been granted access. Valid values: `public`, `unlisted`, `hidden`.
     */
    privacy?: 'public' | 'unlisted' | 'hidden';
    /**
     * The Expo sdkVersion to run the project on. This should line up with the version specified in your package.json.
     */
    sdkVersion?: string;
    /**
     * **Note: Don't use this property unless you are sure what you're doing**
     *
     * The runtime version associated with this manifest.
     * Set this to `{"policy": "nativeVersion"}` to generate it automatically.
     */
    runtimeVersion?: string | {
        policy: 'nativeVersion' | 'sdkVersion' | 'appVersion';
    };
    /**
     * Your app version. In addition to this field, you'll also use `ios.buildNumber` and `android.versionCode` — read more about how to version your app [here](https://docs.expo.dev/distribution/app-stores/#versioning-your-app). On iOS this corresponds to `CFBundleShortVersionString`, and on Android, this corresponds to `versionName`. The required format can be found [here](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring).
     */
    version?: string;
    /**
     * Platforms that your project explicitly supports. If not specified, it defaults to `["ios", "android"]`.
     */
    platforms?: ('android' | 'ios' | 'web')[];
    /**
     * If you would like to share the source code of your app on Github, enter the URL for the repository here and it will be linked to from your Expo project page.
     */
    githubUrl?: string;
    /**
     * Locks your app to a specific orientation with portrait or landscape. Defaults to no lock. Valid values: `default`, `portrait`, `landscape`
     */
    orientation?: 'default' | 'portrait' | 'landscape';
    /**
     * Configuration to force the app to always use the light or dark user-interface appearance, such as "dark mode", or make it automatically adapt to the system preferences. If not provided, defaults to `light`. Requires `expo-system-ui` be installed in your project to work on Android.
     */
    userInterfaceStyle?: 'light' | 'dark' | 'automatic';
    /**
     * The background color for your app, behind any of your React views. This is also known as the root view background color. Requires `expo-system-ui` be installed in your project to work on iOS.
     */
    backgroundColor?: string;
    /**
     * On Android, this will determine the color of your app in the multitasker. Currently this is not used on iOS, but it may be used for other purposes in the future.
     */
    primaryColor?: string;
    /**
     * Local path or remote URL to an image to use for your app's icon. We recommend that you use a 1024x1024 png file. This icon will appear on the home screen and within the Expo app.
     */
    icon?: string;
    /**
     * Configuration for remote (push) notifications.
     */
    notification?: {
        /**
         * (Android only) Local path or remote URL to an image to use as the icon for push notifications. 96x96 png grayscale with transparency. We recommend following [Google's design guidelines](https://material.io/design/iconography/product-icons.html#design-principles). If not provided, defaults to your app icon.
         */
        icon?: string;
        /**
         * (Android only) Tint color for the push notification image when it appears in the notification tray. Defaults to `#ffffff`
         */
        color?: string;
        /**
         * Whether or not to display notifications when the app is in the foreground on iOS. `_displayInForeground` option in the individual push notification message overrides this option. [Learn more.](https://docs.expo.dev/push-notifications/receiving-notifications/#foreground-notification-behavior) Defaults to `false`.
         */
        iosDisplayInForeground?: boolean;
        /**
         * Show each push notification individually (`default`) or collapse into one (`collapse`).
         */
        androidMode?: 'default' | 'collapse';
        /**
         * If `androidMode` is set to `collapse`, this title is used for the collapsed notification message. For example, `'#{unread_notifications} new interactions'`.
         */
        androidCollapsedTitle?: string;
    };
    /**
     * Configuration for the status bar on Android. For more details please navigate to [Configuring StatusBar](https://docs.expo.dev/guides/configuring-statusbar/).
     */
    androidStatusBar?: {
        /**
         * Configures the status bar icons to have a light or dark color. Valid values: `light-content`, `dark-content`. Defaults to `dark-content`
         */
        barStyle?: 'light-content' | 'dark-content';
        /**
         * Specifies the background color of the status bar. Defaults to `#00000000` (transparent) for `dark-content` bar style and `#00000088` (semi-transparent black) for `light-content` bar style
         */
        backgroundColor?: string;
        /**
         * Instructs the system whether the status bar should be visible or not. Defaults to `false`
         */
        hidden?: boolean;
        /**
         * When false, the system status bar pushes the content of your app down (similar to `position: relative`). When true, the status bar floats above the content in your app (similar to `position: absolute`). Defaults to `true` to match the iOS status bar behavior (which can only float above content). Explicitly setting this property to `true` will add `android:windowTranslucentStatus` to `styles.xml` and may cause unexpected keyboard behavior on Android when using the `softwareKeyboardLayoutMode` set to `resize`. In this case you will have to use `KeyboardAvoidingView` to manage the keyboard layout.
         */
        translucent?: boolean;
    };
    /**
     * Configuration for the bottom navigation bar on Android. Can be used to configure the `expo-navigation-bar` module in EAS Build.
     */
    androidNavigationBar?: {
        /**
         * Determines how and when the navigation bar is shown. [Learn more](https://developer.android.com/training/system-ui/immersive). Requires `expo-navigation-bar` be installed in your project. Valid values: `leanback`, `immersive`, `sticky-immersive`
         *
         *  `leanback` results in the navigation bar being hidden until the first touch gesture is registered.
         *
         *  `immersive` results in the navigation bar being hidden until the user swipes up from the edge where the navigation bar is hidden.
         *
         *  `sticky-immersive` is identical to `'immersive'` except that the navigation bar will be semi-transparent and will be hidden again after a short period of time.
         */
        visible?: 'leanback' | 'immersive' | 'sticky-immersive';
        /**
         * Configure the navigation bar icons to have a light or dark color. Supported on Android Oreo and newer. Valid values: `'light-content'`, `'dark-content'`
         */
        barStyle?: 'light-content' | 'dark-content';
        /**
         * Specifies the background color of the navigation bar.
         */
        backgroundColor?: string;
    };
    /**
     * Settings that apply specifically to running this app in a development client
     */
    developmentClient?: {
        /**
         * If true, the app will launch in a development client with no additional dialogs or progress indicators, just like in a standalone app.
         */
        silentLaunch?: boolean;
    };
    /**
     * **Custom Builds Only**. URL scheme(s) to link into your app. For example, if we set this to `'demo'`, then demo:// URLs would open your app when tapped.
     */
    scheme?: string | string[];
    /**
     * Any extra fields you want to pass to your experience. Values are accessible via `Constants.expoConfig.extra` ([Learn more](https://docs.expo.dev/versions/latest/sdk/constants/#constantsmanifest))
     */
    extra?: {
        [k: string]: any;
    };
    /**
     * @deprecated Use a `metro.config.js` file instead. [Learn more](https://docs.expo.dev/guides/customizing-metro/)
     */
    packagerOpts?: {
        [k: string]: any;
    };
    /**
     * Configuration for how and when the app should request OTA JavaScript updates
     */
    updates?: {
        /**
         * If set to false, your standalone app will never download any code, and will only use code bundled locally on the device. In that case, all updates to your app must be submitted through app store review. Defaults to true. (Note: This will not work out of the box with ExpoKit projects)
         */
        enabled?: boolean;
        /**
         * By default, Expo will check for updates every time the app is loaded. Set this to `ON_ERROR_RECOVERY` to disable automatic checking unless recovering from an error. Set this to `NEVER` to completely disable automatic checking. Must be one of `ON_LOAD` (default value), `ON_ERROR_RECOVERY`, `WIFI_ONLY`, or `NEVER`
         */
        checkAutomatically?: 'ON_ERROR_RECOVERY' | 'ON_LOAD' | 'WIFI_ONLY' | 'NEVER';
        /**
         * How long (in ms) to allow for fetching OTA updates before falling back to a cached version of the app. Defaults to 0. Must be between 0 and 300000 (5 minutes).
         */
        fallbackToCacheTimeout?: number;
        /**
         * URL from which expo-updates will fetch update manifests
         */
        url?: string;
        /**
         * Local path of a PEM-formatted X.509 certificate used for requiring and verifying signed Expo updates
         */
        codeSigningCertificate?: string;
        /**
         * Metadata for `codeSigningCertificate`
         */
        codeSigningMetadata?: {
            /**
             * Algorithm used to generate manifest code signing signature.
             */
            alg?: 'rsa-v1_5-sha256';
            /**
             * Identifier for the key in the certificate. Used to instruct signing mechanisms when signing or verifying signatures.
             */
            keyid?: string;
        };
        /**
         * Extra HTTP headers to include in HTTP requests made by `expo-updates`. These may override preset headers.
         */
        requestHeaders?: {
            [k: string]: any;
        };
        /**
         * Whether to use deprecated Classic Updates when developing with the local Expo CLI and creating builds. Omitting this or setting it to false affects the behavior of APIs like `Constants.manifest`. SDK 49 is the last SDK version that supports Classic Updates.
         */
        useClassicUpdates?: boolean;
    };
    /**
     * Provide overrides by locale for System Dialog prompts like Permissions Boxes
     */
    locales?: {
        [k: string]: string | {
            [k: string]: any;
        };
    };
    /**
     * Is app detached
     */
    isDetached?: boolean;
    /**
     * Extra fields needed by detached apps
     */
    detach?: {
        [k: string]: any;
    };
    /**
     * An array of file glob strings which point to assets that will be bundled within your standalone app binary. Read more in the [Offline Support guide](https://docs.expo.dev/guides/offline-support/)
     */
    assetBundlePatterns?: string[];
    /**
     * Config plugins for adding extra functionality to your project. [Learn more](https://docs.expo.dev/guides/config-plugins/).
     */
    plugins?: (string | [] | [string] | [string, any])[];
    splash?: Splash;
    /**
     * Specifies the JavaScript engine for apps. Supported only on EAS Build. Defaults to `hermes`. Valid values: `hermes`, `jsc`.
     */
    jsEngine?: 'hermes' | 'jsc';
    ios?: IOS;
    android?: Android;
    web?: Web;
    /**
     * Configuration for scripts to run to hook into the publish process
     */
    hooks?: {
        postPublish?: PublishHook[];
        postExport?: PublishHook[];
    };
    /**
     * Enable experimental features that may be unstable, unsupported, or removed without deprecation notices.
     */
    experiments?: {
        /**
         * Enable tsconfig/jsconfig `compilerOptions.paths` and `compilerOptions.baseUrl` support for import aliases in Metro.
         */
        tsconfigPaths?: boolean;
        /**
         * Enables Turbo Modules, which are a type of native modules that use a different way of communicating between JS and platform code. When installing a Turbo Module you will need to enable this experimental option (the library still needs to be a part of Expo SDK already, like react-native-reanimated v2). Turbo Modules do not support remote debugging and enabling this option will disable remote debugging.
         */
        turboModules?: boolean;
    };
    /**
     * Internal properties for developer tools
     */
    _internal?: {
        /**
         * List of plugins already run on the config
         */
        pluginHistory?: {
            [k: string]: any;
        };
        [k: string]: any;
    };
}
/**
 * Configuration for loading and splash screen for standalone apps.
 */
export interface Splash {
    /**
     * Color to fill the loading screen background
     */
    backgroundColor?: string;
    /**
     * Determines how the `image` will be displayed in the splash loading screen. Must be one of `cover` or `contain`, defaults to `contain`.
     */
    resizeMode?: 'cover' | 'contain';
    /**
     * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
     */
    image?: string;
    [k: string]: any;
}
/**
 * Configuration that is specific to the iOS platform.
 */
export interface IOS {
    /**
     * The manifest for the iOS version of your app will be written to this path during publish.
     */
    publishManifestPath?: string;
    /**
     * The bundle for the iOS version of your app will be written to this path during publish.
     */
    publishBundlePath?: string;
    /**
     * The bundle identifier for your iOS standalone app. You make it up, but it needs to be unique on the App Store. See [this StackOverflow question](http://stackoverflow.com/questions/11347470/what-does-bundle-identifier-mean-in-the-ios-project).
     */
    bundleIdentifier?: string;
    /**
     * Build number for your iOS standalone app. Corresponds to `CFBundleVersion` and must match Apple's [specified format](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleversion). (Note: Transporter will pull the value for `Version Number` from `expo.version` and NOT from `expo.ios.buildNumber`.)
     */
    buildNumber?: string;
    /**
     * The background color for your iOS app, behind any of your React views. Overrides the top-level `backgroundColor` key if it is present. Requires `expo-system-ui` be installed in your project to work on iOS.
     */
    backgroundColor?: string;
    /**
     * Local path or remote URL to an image to use for your app's icon on iOS. If specified, this overrides the top-level `icon` key. Use a 1024x1024 icon which follows Apple's interface guidelines for icons, including color profile and transparency.
     *
     *  Expo will generate the other required sizes. This icon will appear on the home screen and within the Expo app.
     */
    icon?: string;
    /**
     * URL to your app on the Apple App Store, if you have deployed it there. This is used to link to your store page from your Expo project page if your app is public.
     */
    appStoreUrl?: string;
    /**
     * Enable iOS Bitcode optimizations in the native build. Accepts the name of an iOS build configuration to enable for a single configuration and disable for all others, e.g. Debug, Release. Not available in Expo Go. Defaults to `undefined` which uses the template's predefined settings.
     */
    bitcode?: boolean | string;
    /**
     * Note: This property key is not included in the production manifest and will evaluate to `undefined`. It is used internally only in the build process, because it contains API keys that some may want to keep private.
     */
    config?: {
        /**
         * [Branch](https://branch.io/) key to hook up Branch linking services.
         */
        branch?: {
            /**
             * Your Branch API key
             */
            apiKey?: string;
        };
        /**
         * Sets `ITSAppUsesNonExemptEncryption` in the standalone ipa's Info.plist to the given boolean value.
         */
        usesNonExemptEncryption?: boolean;
        /**
         * [Google Maps iOS SDK](https://developers.google.com/maps/documentation/ios-sdk/start) key for your standalone app.
         */
        googleMapsApiKey?: string;
        /**
         * [Google Mobile Ads App ID](https://support.google.com/admob/answer/6232340) Google AdMob App ID.
         */
        googleMobileAdsAppId?: string;
        /**
         * A boolean indicating whether to initialize Google App Measurement and begin sending user-level event data to Google immediately when the app starts. The default in Expo (Go and in standalone apps) is `false`. [Sets the opposite of the given value to the following key in `Info.plist`.](https://developers.google.com/admob/ios/eu-consent#delay_app_measurement_optional)
         */
        googleMobileAdsAutoInit?: boolean;
    };
    /**
     * [Firebase Configuration File](https://support.google.com/firebase/answer/7015592) Location of the `GoogleService-Info.plist` file for configuring Firebase.
     */
    googleServicesFile?: string;
    /**
     * Whether your standalone iOS app supports tablet screen sizes. Defaults to `false`.
     */
    supportsTablet?: boolean;
    /**
     * If true, indicates that your standalone iOS app does not support handsets, and only supports tablets.
     */
    isTabletOnly?: boolean;
    /**
     * If true, indicates that your standalone iOS app does not support Slide Over and Split View on iPad. Defaults to `false`
     */
    requireFullScreen?: boolean;
    /**
     * Configuration to force the app to always use the light or dark user-interface appearance, such as "dark mode", or make it automatically adapt to the system preferences. If not provided, defaults to `light`.
     */
    userInterfaceStyle?: 'light' | 'dark' | 'automatic';
    /**
     * Dictionary of arbitrary configuration to add to your standalone app's native Info.plist. Applied prior to all other Expo-specific configuration. No other validation is performed, so use this at your own risk of rejection from the App Store.
     */
    infoPlist?: {
        [k: string]: any;
    };
    /**
     * Dictionary of arbitrary configuration to add to your standalone app's native *.entitlements (plist). Applied prior to all other Expo-specific configuration. No other validation is performed, so use this at your own risk of rejection from the App Store.
     */
    entitlements?: {
        [k: string]: any;
    };
    /**
     * An array that contains Associated Domains for the standalone app. [Learn more](https://developer.apple.com/documentation/safariservices/supporting_associated_domains).
     */
    associatedDomains?: string[];
    /**
     * A boolean indicating if the app uses iCloud Storage for `DocumentPicker`. See `DocumentPicker` docs for details.
     */
    usesIcloudStorage?: boolean;
    /**
     * A boolean indicating if the app uses Apple Sign-In. See `AppleAuthentication` docs for details.
     */
    usesAppleSignIn?: boolean;
    /**
     * A Boolean value that indicates whether the app may access the notes stored in contacts. You must [receive permission from Apple](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_contacts_notes) before you can submit your app for review with this capability.
     */
    accessesContactNotes?: boolean;
    /**
     * Configuration for loading and splash screen for standalone iOS apps.
     */
    splash?: {
        /**
         * Color to fill the loading screen background
         */
        backgroundColor?: string;
        /**
         * Determines how the `image` will be displayed in the splash loading screen. Must be one of `cover` or `contain`, defaults to `contain`.
         */
        resizeMode?: 'cover' | 'contain';
        /**
         * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
         */
        image?: string;
        /**
         * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
         */
        tabletImage?: string;
        /**
         * Configuration for loading and splash screen for standalone iOS apps in dark mode.
         */
        dark?: {
            /**
             * Color to fill the loading screen background
             */
            backgroundColor?: string;
            /**
             * Determines how the `image` will be displayed in the splash loading screen. Must be one of `cover` or `contain`, defaults to `contain`.
             */
            resizeMode?: 'cover' | 'contain';
            /**
             * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
             */
            image?: string;
            /**
             * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
             */
            tabletImage?: string;
            [k: string]: any;
        };
        [k: string]: any;
    };
    /**
     * Specifies the JavaScript engine for iOS apps. Supported only on EAS Build. Defaults to `hermes`. Valid values: `hermes`, `jsc`.
     */
    jsEngine?: 'hermes' | 'jsc';
    /**
     * **Note: Don't use this property unless you are sure what you're doing**
     *
     * The runtime version associated with this manifest for the iOS platform. If provided, this will override the top level runtimeVersion key.
     * Set this to `{"policy": "nativeVersion"}` to generate it automatically.
     */
    runtimeVersion?: string | {
        policy: 'nativeVersion' | 'sdkVersion' | 'appVersion';
    };
}
/**
 * Configuration that is specific to the Android platform.
 */
export interface Android {
    /**
     * The manifest for the Android version of your app will be written to this path during publish.
     */
    publishManifestPath?: string;
    /**
     * The bundle for the Android version of your app will be written to this path during publish.
     */
    publishBundlePath?: string;
    /**
     * The package name for your Android standalone app. You make it up, but it needs to be unique on the Play Store. See [this StackOverflow question](http://stackoverflow.com/questions/6273892/android-package-name-convention).
     */
    package?: string;
    /**
     * Version number required by Google Play. Increment by one for each release. Must be a positive integer. [Learn more](https://developer.android.com/studio/publish/versioning.html)
     */
    versionCode?: number;
    /**
     * The background color for your Android app, behind any of your React views. Overrides the top-level `backgroundColor` key if it is present.
     */
    backgroundColor?: string;
    /**
     * Configuration to force the app to always use the light or dark user-interface appearance, such as "dark mode", or make it automatically adapt to the system preferences. If not provided, defaults to `light`. Requires `expo-system-ui` be installed in your project to work on Android.
     */
    userInterfaceStyle?: 'light' | 'dark' | 'automatic';
    /**
     * Local path or remote URL to an image to use for your app's icon on Android. If specified, this overrides the top-level `icon` key. We recommend that you use a 1024x1024 png file (transparency is recommended for the Google Play Store). This icon will appear on the home screen and within the Expo app.
     */
    icon?: string;
    /**
     * Settings for an Adaptive Launcher Icon on Android. [Learn more](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
     */
    adaptiveIcon?: {
        /**
         * Local path or remote URL to an image to use for your app's icon on Android. If specified, this overrides the top-level `icon` and the `android.icon` keys. Should follow the [specified guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive). This icon will appear on the home screen.
         */
        foregroundImage?: string;
        /**
         * Local path or remote URL to an image representing the Android 13+ monochromatic icon. Should follow the [specified guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive). This icon will appear on the home screen when the user enables 'Themed icons' in system settings on a device running Android 13+.
         */
        monochromeImage?: string;
        /**
         * Local path or remote URL to a background image for your app's Adaptive Icon on Android. If specified, this overrides the `backgroundColor` key. Must have the same dimensions as `foregroundImage`, and has no effect if `foregroundImage` is not specified. Should follow the [specified guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive).
         */
        backgroundImage?: string;
        /**
         * Color to use as the background for your app's Adaptive Icon on Android. Defaults to white, `#FFFFFF`. Has no effect if `foregroundImage` is not specified.
         */
        backgroundColor?: string;
    };
    /**
     * URL to your app on the Google Play Store, if you have deployed it there. This is used to link to your store page from your Expo project page if your app is public.
     */
    playStoreUrl?: string;
    /**
     * List of permissions used by the standalone app.
     *
     *  To use ONLY the following minimum necessary permissions and none of the extras supported by Expo in a default managed app, set `permissions` to `[]`. The minimum necessary permissions do not require a Privacy Policy when uploading to Google Play Store and are:
     * • receive data from Internet
     * • view network connections
     * • full network access
     * • change your audio settings
     * • prevent device from sleeping
     *
     *  To use ALL permissions supported by Expo by default, do not specify the `permissions` key.
     *
     *   To use the minimum necessary permissions ALONG with certain additional permissions, specify those extras in `permissions`, e.g.
     *
     *  `[ "CAMERA", "ACCESS_FINE_LOCATION" ]`.
     *
     *   You can specify the following permissions depending on what you need:
     *
     * - `ACCESS_COARSE_LOCATION`
     * - `ACCESS_FINE_LOCATION`
     * - `ACCESS_BACKGROUND_LOCATION`
     * - `CAMERA`
     * - `RECORD_AUDIO`
     * - `READ_CONTACTS`
     * - `WRITE_CONTACTS`
     * - `READ_CALENDAR`
     * - `WRITE_CALENDAR`
     * - `READ_EXTERNAL_STORAGE`
     * - `WRITE_EXTERNAL_STORAGE`
     * - `USE_FINGERPRINT`
     * - `USE_BIOMETRIC`
     * - `WRITE_SETTINGS`
     * - `VIBRATE`
     * - `READ_PHONE_STATE`
     * - `FOREGROUND_SERVICE`
     * - `WAKE_LOCK`
     * - `com.anddoes.launcher.permission.UPDATE_COUNT`
     * - `com.android.launcher.permission.INSTALL_SHORTCUT`
     * - `com.google.android.c2dm.permission.RECEIVE`
     * - `com.google.android.gms.permission.ACTIVITY_RECOGNITION`
     * - `com.google.android.providers.gsf.permission.READ_GSERVICES`
     * - `com.htc.launcher.permission.READ_SETTINGS`
     * - `com.htc.launcher.permission.UPDATE_SHORTCUT`
     * - `com.majeur.launcher.permission.UPDATE_BADGE`
     * - `com.sec.android.provider.badge.permission.READ`
     * - `com.sec.android.provider.badge.permission.WRITE`
     * - `com.sonyericsson.home.permission.BROADCAST_BADGE`
     *
     */
    permissions?: string[];
    /**
     * List of permissions to block in the final `AndroidManifest.xml`. This is useful for removing permissions that are added by native package `AndroidManifest.xml` files which are merged into the final manifest. Internally this feature uses the `tools:node="remove"` XML attribute to remove permissions. Not available in Expo Go.
     */
    blockedPermissions?: string[];
    /**
     * [Firebase Configuration File](https://support.google.com/firebase/answer/7015592) Location of the `GoogleService-Info.plist` file for configuring Firebase. Including this key automatically enables FCM in your standalone app.
     */
    googleServicesFile?: string;
    /**
     * Note: This property key is not included in the production manifest and will evaluate to `undefined`. It is used internally only in the build process, because it contains API keys that some may want to keep private.
     */
    config?: {
        /**
         * [Branch](https://branch.io/) key to hook up Branch linking services.
         */
        branch?: {
            /**
             * Your Branch API key
             */
            apiKey?: string;
        };
        /**
         * [Google Maps Android SDK](https://developers.google.com/maps/documentation/android-api/signup) configuration for your standalone app.
         */
        googleMaps?: {
            /**
             * Your Google Maps Android SDK API key
             */
            apiKey?: string;
        };
        /**
         * [Google Mobile Ads App ID](https://support.google.com/admob/answer/6232340) Google AdMob App ID.
         */
        googleMobileAdsAppId?: string;
        /**
         * A boolean indicating whether to initialize Google App Measurement and begin sending user-level event data to Google immediately when the app starts. The default in Expo (Client and in standalone apps) is `false`. [Sets the opposite of the given value to the following key in `Info.plist`](https://developers.google.com/admob/ios/eu-consent#delay_app_measurement_optional)
         */
        googleMobileAdsAutoInit?: boolean;
    };
    /**
     * Configuration for loading and splash screen for managed and standalone Android apps.
     */
    splash?: {
        /**
         * Color to fill the loading screen background
         */
        backgroundColor?: string;
        /**
         * Determines how the `image` will be displayed in the splash loading screen. Must be one of `cover`, `contain` or `native`, defaults to `contain`.
         */
        resizeMode?: 'cover' | 'contain' | 'native';
        /**
         * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
         */
        image?: string;
        /**
         * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
         *
         *  `Natural sized image (baseline)`
         */
        mdpi?: string;
        /**
         * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
         *
         *  `Scale 1.5x`
         */
        hdpi?: string;
        /**
         * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
         *
         *  `Scale 2x`
         */
        xhdpi?: string;
        /**
         * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
         *
         *  `Scale 3x`
         */
        xxhdpi?: string;
        /**
         * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
         *
         *  `Scale 4x`
         */
        xxxhdpi?: string;
        /**
         * Configuration for loading and splash screen for managed and standalone Android apps in dark mode.
         */
        dark?: {
            /**
             * Color to fill the loading screen background
             */
            backgroundColor?: string;
            /**
             * Determines how the `image` will be displayed in the splash loading screen. Must be one of `cover`, `contain` or `native`, defaults to `contain`.
             */
            resizeMode?: 'cover' | 'contain' | 'native';
            /**
             * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
             */
            image?: string;
            /**
             * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
             *
             *  `Natural sized image (baseline)`
             */
            mdpi?: string;
            /**
             * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
             *
             *  `Scale 1.5x`
             */
            hdpi?: string;
            /**
             * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
             *
             *  `Scale 2x`
             */
            xhdpi?: string;
            /**
             * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
             *
             *  `Scale 3x`
             */
            xxhdpi?: string;
            /**
             * Local path or remote URL to an image to fill the background of the loading screen in "native" mode. Image size and aspect ratio are up to you. [Learn more]( https://developer.android.com/training/multiscreen/screendensities)
             *
             *  `Scale 4x`
             */
            xxxhdpi?: string;
            [k: string]: any;
        };
        [k: string]: any;
    };
    /**
     * Configuration for setting an array of custom intent filters in Android manifest. [Learn more](https://developer.android.com/guide/components/intents-filters)
     */
    intentFilters?: {
        /**
         * You may also use an intent filter to set your app as the default handler for links (without showing the user a dialog with options). To do so use `true` and then configure your server to serve a JSON file verifying that you own the domain. [Learn more](https://developer.android.com/training/app-links)
         */
        autoVerify?: boolean;
        action: string;
        data?: AndroidIntentFiltersData | AndroidIntentFiltersData[];
        category?: string | string[];
    }[];
    /**
     * Allows your user's app data to be automatically backed up to their Google Drive. If this is set to false, no backup or restore of the application will ever be performed (this is useful if your app deals with sensitive information). Defaults to the Android default, which is `true`.
     */
    allowBackup?: boolean;
    /**
     * Determines how the software keyboard will impact the layout of your application. This maps to the `android:windowSoftInputMode` property. Defaults to `resize`. Valid values: `resize`, `pan`.
     */
    softwareKeyboardLayoutMode?: 'resize' | 'pan';
    /**
     * Specifies the JavaScript engine for Android apps. Supported only on EAS Build and in Expo Go. Defaults to `hermes`. Valid values: `hermes`, `jsc`.
     */
    jsEngine?: 'hermes' | 'jsc';
    /**
     * **Note: Don't use this property unless you are sure what you're doing**
     *
     * The runtime version associated with this manifest for the Android platform. If provided, this will override the top level runtimeVersion key.
     * Set this to `{"policy": "nativeVersion"}` to generate it automatically.
     */
    runtimeVersion?: string | {
        policy: 'nativeVersion' | 'sdkVersion' | 'appVersion';
    };
}
export interface AndroidIntentFiltersData {
    /**
     * Scheme of the URL, e.g. `https`
     */
    scheme?: string;
    /**
     * Hostname, e.g. `myapp.io`
     */
    host?: string;
    /**
     * Port, e.g. `3000`
     */
    port?: string;
    /**
     * Exact path for URLs that should be matched by the filter, e.g. `/records`
     */
    path?: string;
    /**
     * Pattern for paths that should be matched by the filter, e.g. `.*`. Must begin with `/`
     */
    pathPattern?: string;
    /**
     * Prefix for paths that should be matched by the filter, e.g. `/records/` will match `/records/123`
     */
    pathPrefix?: string;
    /**
     * MIME type for URLs that should be matched by the filter
     */
    mimeType?: string;
}
/**
 * Configuration that is specific to the web platform.
 */
export interface Web {
    /**
     * Sets the rendering method for the web app for both `expo start` and `expo export`. `static` statically renders HTML files for every route in the `app/` directory, which is available only in Expo Router apps. `single` outputs a Single Page Application (SPA), with a single `index.html` in the output folder, and has no statically indexable HTML. Defaults to `single`.
     */
    output?: 'single' | 'static';
    /**
     * Relative path of an image to use for your app's favicon.
     */
    favicon?: string;
    /**
     * Defines the title of the document, defaults to the outer level name
     */
    name?: string;
    /**
     * A short version of the app's name, 12 characters or fewer. Used in app launcher and new tab pages. Maps to `short_name` in the PWA manifest.json. Defaults to the `name` property.
     */
    shortName?: string;
    /**
     * Specifies the primary language for the values in the name and short_name members. This value is a string containing a single language tag.
     */
    lang?: string;
    /**
     * Defines the navigation scope of this website's context. This restricts what web pages can be viewed while the manifest is applied. If the user navigates outside the scope, it returns to a normal web page inside a browser tab/window. If the scope is a relative URL, the base URL will be the URL of the manifest.
     */
    scope?: string;
    /**
     * Defines the color of the Android tool bar, and may be reflected in the app's preview in task switchers.
     */
    themeColor?: string;
    /**
     * Provides a general description of what the pinned website does.
     */
    description?: string;
    /**
     * Specifies the primary text direction for the name, short_name, and description members. Together with the lang member, it helps the correct display of right-to-left languages.
     */
    dir?: 'auto' | 'ltr' | 'rtl';
    /**
     * Defines the developers’ preferred display mode for the website.
     */
    display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
    /**
     * The URL that loads when a user launches the application (e.g., when added to home screen), typically the index. Note: This has to be a relative URL, relative to the manifest URL.
     */
    startUrl?: string;
    /**
     * Defines the default orientation for all the website's top level browsing contexts.
     */
    orientation?: 'any' | 'natural' | 'landscape' | 'landscape-primary' | 'landscape-secondary' | 'portrait' | 'portrait-primary' | 'portrait-secondary';
    /**
     * Defines the expected “background color” for the website. This value repeats what is already available in the site’s CSS, but can be used by browsers to draw the background color of a shortcut when the manifest is available before the stylesheet has loaded. This creates a smooth transition between launching the web application and loading the site's content.
     */
    backgroundColor?: string;
    /**
     * If content is set to default, the status bar appears normal. If set to black, the status bar has a black background. If set to black-translucent, the status bar is black and translucent. If set to default or black, the web content is displayed below the status bar. If set to black-translucent, the web content is displayed on the entire screen, partially obscured by the status bar.
     */
    barStyle?: 'default' | 'black' | 'black-translucent';
    /**
     * Hints for the user agent to indicate to the user that the specified native applications (defined in expo.ios and expo.android) are recommended over the website.
     */
    preferRelatedApplications?: boolean;
    /**
     * Experimental features. These will break without deprecation notice.
     */
    dangerous?: {
        [k: string]: any;
    };
    /**
     * Configuration for PWA splash screens.
     */
    splash?: {
        /**
         * Color to fill the loading screen background
         */
        backgroundColor?: string;
        /**
         * Determines how the `image` will be displayed in the splash loading screen. Must be one of `cover` or `contain`, defaults to `contain`.
         */
        resizeMode?: 'cover' | 'contain';
        /**
         * Local path or remote URL to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.
         */
        image?: string;
        [k: string]: any;
    };
    /**
     * Firebase web configuration. Used by the expo-firebase packages on both web and native. [Learn more](https://firebase.google.com/docs/reference/js/firebase.html#initializeapp)
     */
    config?: {
        firebase?: {
            apiKey?: string;
            authDomain?: string;
            databaseURL?: string;
            projectId?: string;
            storageBucket?: string;
            messagingSenderId?: string;
            appId?: string;
            measurementId?: string;
            [k: string]: any;
        };
        [k: string]: any;
    };
    /**
     * Sets the bundler to use for the web platform. Only supported in the local CLI `npx expo`.
     */
    bundler?: 'webpack' | 'metro';
    [k: string]: any;
}
export interface PublishHook {
    file?: string;
    config?: {
        [k: string]: any;
    };
    [k: string]: any;
}
