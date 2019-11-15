# expo-notifications

## Instalation 

`expo-notifications` needs `react-native-unimodule` to work. You can read more about it [here](https://www.npmjs.com/package/react-native-unimodules). 

Add `expo-notifications` to your project:
execute the following command in your project root directory:
"yarn add expo-notifications".

### Android

#### 1. Modify AndroidManifest

`AndroidManifest.xml` is a place where you can configure `expo-notifications` module. For Instance, you can choose there
if you want to use Expo's servers as a middleman or choose that you don't want to use push notifications at all.

Configuration template:

```xml

<!-- expo-notifications START -->
    <!-- turn on push notifications START -->
        <service
        android:name="expo.modules.notifications.push.fcm.ExpoFcmMessagingService"
        android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service> 

        <!-- choose if you want to use expo servers START -->
        <meta-data android:name="appId" android:value="@username/slug" /> <!-- only with expo engine -->
        <meta-data android:name="pushNotificationEngine" android:value="expo" /> <!-- expo|bare -->
        <!-- choose if you want to use expo servers END -->

    <!-- turn on push notifications END -->

    <!-- tell us which activity should be launched when notification is tapped START -->
        <meta-data android:name="notificationReceiver" android:value="com.example.MainActivity" />
    <!-- tell us which activity should be launched when notification is tapped END -->
<!-- expo-notifications END -->

```

##### Case I: Use only local notifications 

All you need to do is provide us which Activity should be launched after notification is tapped.
In most cases, you should provide the starting activity.

##### Case II: Use Firebase without Expo servers 

Do the same configuration as in the case I but additionally copy service declaration from our template to your `AndroidManifest.xml`. Of course, you also need to go through (Firebase installation process)[https://firebase.google.com/docs/android/setup].

##### Case III: Use Expo servers 

Do the same as in the case I and II but additionally: 
 1. create Expo account 
 2. create `app.json` file with `slug` property 
 3. use Expo credential manager to upload your Firebase key (link)[https://docs.expo.io/versions/v35.0.0/workflow/expo-cli/] 

Add the following snippet to your `AndroidManifest.xml`: 

```xml

<!-- choose if you want to use expo servers START -->
    <meta-data android:name="appId" android:value="@username/slug" /> <!-- only with expo engine -->
    <meta-data android:name="pushNotificationEngine" android:value="expo" /> <!-- expo|bare -->
<!-- choose if you want to use expo servers END -->

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

