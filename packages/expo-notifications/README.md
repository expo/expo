# expo-notifications

## Instalation 

`expo-notifications` requires `react-native-unimodule` to work. You can read more about it [here](https://www.npmjs.com/package/react-native-unimodules). 

Add `expo-notifications` to your project:
execute the following command in your project root directory:
"yarn add expo-notifications".

### Android

#### 1. Modify AndroidManifest

`AndroidManifest.xml` is a place where you can configure `expo-notifications` module. For Instance, you can choose there
if you want to use Expo's servers as a middleman or choose that you don't want to use push notifications at all.

##### Case I: Use only local notifications 

Almost always you don't need to change anything in your `AndroidManifest.xml` in this scenario.
However, if you want to choose which Activity should be launched after notification is tapped you need to inform us about it by adding `intent-filter` to your Activity in `AndroidManifest.xml`.
If you don't do so then starting Activity will be chosen.

What the `intent-filter` should look like:

```xml
...
 <activity
    android:name=".ActivityName"
    android:label="@string/app_name"
    android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
    android:windowSoftInputMode="adjustResize">
    <!--  start -->
    <intent-filter>
        <action android:name="expo.modules.notifications.ACTION_RECEIVE_NOTIFICATION" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter> 
    <!-- end -->
</activity>
...
```

##### Case II: Use Firebase without Expo servers 

Do the same configuration as in the case I but additionally add Firebase service declaration to your `AndroidManifest.xml`. Of course, you also need to go through [Firebase installation process](https://firebase.google.com/docs/android/setup).

```xml
<application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme">
    
    <!-- turn on push notifications START -->
        <service
            android:name="expo.modules.notifications.push.fcm.ExpoFcmMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service> 

        <!-- choose if you want to use expo servers START -->
        <meta-data android:name="expo.modules.notifications.configuration.APP_ID" android:value="@username/slug" /> 
        <!-- choose if you want to use expo servers END -->
    <!-- turn on push notifications END -->
    
</application>
```

##### Case III: Use Expo servers 

Do the same as in the case I and II but additionally: 
 1. create Expo account 
 2. create `app.json` file with `slug` property 
 3. use Expo credential manager to upload your Firebase key [link](https://docs.expo.io/versions/v35.0.0/workflow/expo-cli/) 

Add the following snippet to your `AndroidManifest.xml`: 

```xml
<application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme">
    <!-- choose if you want to use expo servers START -->
        <meta-data android:name="expo.modules.notifications.configuration.APP_ID" android:value="@username/slug" /> 
    <!-- choose if you want to use expo servers END -->
</application>
```

Remember to replace `username` and `slug` with your values.

#### Init DBFlow in Application.onCreate()

```Java

@Override
public void onCreate() {
    super.onCreate();
    // init FlowManager [it's used by expo-notifications]
    FlowManager.init(FlowConfig.builder(getApplicationContext())
        .addDatabaseHolder(ExpoNotificationsGeneratedDatabaseHolder.class)
        .build()
    );
}

```

### iOS

#### Modify Info.plist

Similarly to `AndroidManifets.xml` on Android `Info.plist` allows you to configure the behavior of `expo-notifications` on the iOS platform.

Unlike on Android, you need to modify your `Info.plist` only if you want to use Expo servers.
If that is the case, then for keys `appId` and `engineType` add values "@username/slug" and "expo", respectively.

## API



### Categories (Action Buttons)

### Channels and Channel Groups (Android only)

### Scheduling

## Types

## Expo Push Notifications

### Testing

