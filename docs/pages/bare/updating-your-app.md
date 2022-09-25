---
title: Updating your app
---

EAS update works with projects created with `react-native init` and with Expo projects that are ejected. These projects have **android** and **ios** directories so that we can modify native files directly.

The steps for configuring a bare React Native project are identical to the steps for configuring an Expo project. However, you may need to edit some of the code `eas update:configure` and `eas build:configure` generates depending on how you build and run your project.

## App config

The `eas update:configure` will add two values to our project's app config (**app.json**/**app.config.js**).

```json
{
  "expo": {
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/..."
      ...
    }
    ...
  }
}
```

The `runtimeVerson` property guarantees compatibility between a build's native code and an update. For bare React Native projects, it's necessary to set this value manually whenever you make a change to any native code in your project. Read [our doc on runtime versions](/eas-update/runtime-versions/#custom--runtimeversion) and learn how to [avoid publishing bad updates](/eas-update/runtime-versions/#avoiding-crashes-with-incompatible-updates).

The `updates.url` property will eventually tell your app to query against for updates. This `url` is our "https://u.expo.dev" domain, followed by your project's ID on EAS' servers. If you go to the URL directly, you'll see an error about missing a header. You can see a manifest by adding three query parameters to the URL: `runtime-version`, `channel-name`, and `platform`. If we published an update with a runtime version of `1.0.0`, a channel of `production`, and a platform of `android`, the full URL you could visit would be similar to this:

```
https://u.expo.dev/your-project-id?runtime-version=1.0.0&channel-name=production&platform=android
```

## EAS config and native files

To generate an EAS config (**eas.json**), run `eas build:configure`. This command will create the **eas.json** file and it will also modify the **AndroidManifest.xml** file inside the **android** directory and the **Expo.plist** file inside the **ios** directory.

Inside **eas.json**, we'll want to add `channel` properties to each build profile we'd like to send updates to. Assuming we're using the default **eas.json** configuration, we recommend adding `channel` properties to the `preview` and `production` build profiles.

```json
{
  "build": {
    "preview": {
      "channel": "preview",
      ...
    },
    "production": {
      "channel": "production",
      ...
    }
    ...
  }
}
```

Inside **AndroidManifest.xml**, we'll see the following additions:

```xml
<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/your-project-id"/>
<meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="1.0.0"/>
```

The `EXPO_UPDATE_URL` value should contain your project's ID.

Inside **Expo.plist**, we'll see the following additions:

```xml
<key>EXUpdatesRuntimeVersion</key>
<string>1.0.0</string>
<key>EXUpdatesURL</key>
<string>https://u.expo.dev/your-project-id</string>
```

The `EXUpdatesURL` value should contain your project's ID.

Once we've built our project into a build, the `expo-updates` library will make requests for manifests with the native configuration defined above, along with the channel specified in **eas.json**.

## Configuring the channel manually

If we create a build with EAS Build, the channel name from **eas.json** will automatically be added to our build's **AndroidManifest.xml** and **Expo.plist** at build time. If you're using EAS Build, the following steps are not necessary.

If your project is not using EAS Build or you are creating release builds with either `expo run:ios --configuration Release` or `expo run:android --variant release`, you'll need to set the channel configuration manually inside both **AndroidManifest.xml** and **Expo.plist**.

In **AndroidManifest.xml**, you'll need to add the following, replacing `your-channel-name` with the channel that matches your project:

```xml
<meta-data android:name="expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY" android:value="{'expo-channel-name':'your-channel-name'}"/>
```

In **Expo.plist**, you'll need to add the following, replacing `your-channel-name` with the channel that matches your project:

```xml
<key>EXUpdatesRequestHeaders</key>
<dict>
  <key>expo-channel-name</key>
  <string>your-channel-name</string>
</dict>
```

## What's next

Once our project is set up with EAS Update, eventually we'll make native changes to your project. Whenever that happens, we'll need to update the `runtimeVersion` in our project's app config. Then, we'll need to run `eas build:configure`, which will update **AndroidManifest.xml** and **Expo.plist** with the new runtime version. Once that's done, we'll need to make new builds, after which, we'll be able to send updates with `eas update`.

## Set your own updates service

EAS Update is a great updates service for most projects, however, some projects have unique requirements that make a self-hosted updates service a better solution. Since the expo-updates library is open source and follows the Expo Updates protocol, you can set up a custom server to serve updates to your end-users. [Learn more](/distribution/custom-updates-server).
