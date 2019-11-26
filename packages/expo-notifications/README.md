# expo-notifications

## Instalation 

`expo-notifications` requires `react-native-unimodule` to work. You can read more about it [here](https://www.npmjs.com/package/react-native-unimodules). 

Add `expo-notifications` to your project:
<mark>yarn add expo-notifications</mark>.

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

Unlike on Android, you need to modify `Info.plist` only if you want to use Expo servers.
If that is the case, then for key `EXNotificationsAppId`  add value "@username/slug" just like on Android.
More about `info.plist` [here](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Introduction/Introduction.html).

## Example

```ts
export default class App extends React.Component {

  constructor(props) {
    super(props);

    Notifications.addOnForegroundNotificationListener(
      async (foregroundNotification: Notifications.ForegroundNotification) => {
        console.log(foregroundNotification);
      }
    );
    Notifications.addOnUserInteractionListener(
      async (userInteraction: Notifications.UserInteraction) => {
        console.log(userInteraction);
      }
    );
  }

  componentDidMount() {
    this._obtainUserFacingNotifPermissionsAsync();
  }

  render() {
    return (
        <TouchableOpacity onPress={this._presentNotification}>
            present notification
        </TouchableOpacity> 
    );
  }

  _presentNotification = async () => {
        Notifications.presentLocalNotificationAsync(
            {
                title: "title",
                body: "the best body for notification",
                sound: true,
            }
        );
  };

  _obtainUserFacingNotifPermissionsAsync = async () => {
    let permission = await Permissions.getAsync(
      Permissions.USER_FACING_NOTIFICATIONS
    );
    if (permission.status !== 'granted') {
      permission = await Permissions.askAsync(
        Permissions.USER_FACING_NOTIFICATIONS
      );
      if (permission.status !== 'granted') {
        alert(`We don't have permission to present notifications.`);
      }
    }
    return permission;
  };

}
```

## Glossary

### AppId
String with format `@username/slug`.
### Background app state
State when no UserInteractionListener has been registered.
### Category
Category defines a set of actions with which a user may interact with and respond to the incoming notification. You can read more about categories [here (for iOS)](https://developer.apple.com/documentation/usernotifications/unnotificationcategory) and [here (for Android)](https://developer.android.com/guide/topics/ui/notifiers/notifications#Actions).
### Channel
Same as Android channel, but available for all Android versions.
### Foreground app state
State when at least one UserInteractionListener has been registered.
### ForegroundNotification
Object representing notification which was about to display but app was in foreground state so module lets you decide if you want to display notification. For instance, you can show dialog or display as any other notification by passing `ForegroundNotification` to `presentLocalNotificationAsync()`.
### UserInteraction
Object representing the way user interacted with notification. It contains information if user tapped a particular action button or for example typed something to remote input. Look to types section for more detailed description of `UserInteraction` object.

## API

### Main Methods

#### `Notifications.addOnUserInteractionListener()`

##### Signature
```ts
function addOnUserInteractionListener(
  listener: OnUserInteractionListener
): Subscription
```
##### Description
Registers for UserInteraction objects which will be delivered each time user interact with notification.
Instead of implementing one huge `OnUserInteractionListener` you can register multiple listeners each responsible 
for different types of notifications. 

#### `Notifications.addOnForegroundNotificationListener()`

##### Signature
```ts
function addOnForegroundNotificationListener(
  listener: OnForegroundNotificationListener
): Subscription
```

##### Description
Registers for ForegroundNotification objects which will be delivered each time notification is about to display but app is foreground state.
Just like with `OnUserInteractionListener` you can register multiple listeners each responsible 
for different types of notifications. 

If you don't want to inform user of message included in notification by yourself and don't want to drop notification
then you can still present notifiation:

```ts
Notifications.addOnForegroundNotificationListener(
    async (foregroundNotification: Notifications.ForegroundNotification) => {
        Notifications.presentLocalNotificationAsync(foregroundNotification);
    }
);
```

#### `Notifications.presentLocalNotificationAsync(notification: Notification): Promise<string> `
Presents notification right away regardless of app state (foreground/background).  
Look at types section to find out more about notification format.
Returns notification id which later can be used to dismiss notification.

### Categories (Action Buttons)

#### `Notifications.createCategoryAsync(name: string, actions: ActionType[])`

Registers a new set of actions under given `name`.

#### `Notifications.deleteCategoryAsync(name: string)`

Deletes category for given `name`.

### Channels and Channel Groups (Android only)

_Android only_. On Android 8.0+, creates a new notification channel to which local and push notifications may be posted. Channels are visible to your users in the OS Settings app as "categories", and they can change settings or disable notifications entirely on a per-channel basis. NOTE: after calling this method, you may no longer be able to alter the settings for this channel, and cannot fully delete the channel without uninstalling the app. Notification channels are required on Android 8.0+, but use this method with caution and be sure to plan your channels carefully.

According to the [Android docs](https://developer.android.com/training/notify-user/channels),

> You should create a channel for each distinct type of notification you need to send. You can also create notification channels to reflect choices made by users of your app. For example, you can set up separate notification channels for each conversation group created by a user in a messaging app.

On devices with Android 7.1 and below, Expo will "polyfill" channels for you by saving your channel's settings and automatically applying them to any notifications you designate with the `channelId`.

#### `Notifications.createChannelAsync(id: string, channel: Channel): Promise<void>`
Creates channel.
#### `Notifications.deleteChannelAsync(id: string): Promise<void>`
Deletes channel.
#### `Notifications.createChannelGroupAsync(groupId: string, groupName: string): Promise<void>`
Creates channel group.
#### `Notifications.deleteChannelGroupAsync(groupId: string): Promise<void>`
Deletes channel group.

### Scheduling

#### `Notifications.scheduleNotificationWithCalendarAsync`

##### Signature
```ts
async function scheduleNotificationWithCalendarAsync(
  notification: ForegroundNotification,
  options: {
    year?: number; 
    month?: number; // range [1, 12]
    hour?: number; 
    day?: number; //  day in month starts from 1
    minute?: number; 
    second?: number;
    weekDay?: number; // day in a week from 0 to 7 (where 0 and 7 means Sunday)
    repeat?: boolean; 
  } = {}
): Promise<string>
```
##### Description
Schedules notification in cronlike style. 
Returns notification id which later can be used to cancel or dismiss notification.
> Do not use `day` and `weekDay` properties together.

#### `Notifications.scheduleNotificationWithTimerAsync()`
##### Signature
```ts
async function scheduleNotificationWithTimerAsync(
  notification: Notification,
  options: {
    interval: number; // number of miliseconds (on iOS it must be at least 60000 if repeating)
    repeat?: boolean; 
  }
): Promise<string>
```
##### Description
Presents notification after the specified number of seconds elapse.
Returns notification id which later can be used to cancel or dismiss notification.

#### `Notifications.cancelScheduledNotificationAsync(notificationId: string): Promise<void>`
Cancels notification.
#### `Notifications.cancelAllScheduledNotificationsAsync(): Promise<void>`
Cancels all notifications.

### Push Notifications

#### `Notifications.setOnTokenChangeListenerAsync(listener: OnTokenChangeListener): Promise<void>`
Sets token lister which will be triggered if push token is created or changed.
If you choose to use Expo as a middleman then listener will receive ExpoPushToken and firebase token otherwise.
Setting a token lister is also a registration for push notifications.

### Other Methods

#### `Notifications.dismissNotificationAsync(notificationId: string): Promise<void>`
If sticky notification is diplayed you can dismissed it with this method.
#### `Notifications.dismissAllNotificationsAsync(): Promise<void>`
Dismiss All notifications.

## Types

### Notification

```ts
type Notification = {
  title: string;                            //1
  body?: string;                            //2
  data?: any;                               //3
  categoryId?: string;                      //4    
  ios?: {                   
    sound?: boolean;                        //5    
    _displayInForeground?: boolean;         //6
  };
  android?: {                               
    channelId?: string;                     //7
    icon?: string;                          //8
    sticky?: boolean;                       //9
    link?: string;                          //10
    exact?: boolean;                        //11
  };
  web?: NotificationOptions;                //12
};
```

1. Title of notification.
2. Notification message.
3. Addition object for your data which you will receive later.
4. Id of category.
5. Should sound be played when notification is displayed (false by default).
6. Currently noop.
7. Id of channel.
8. Icon URI. Only large icon can be modified programmatically.
   In order to change small icon go to `Notification Icon` section.
9. true - if notification shouldn't be dismissed automatically (false by default).
10. Link that should be opend after notification is tapped.
    Example: 'https://.expo.io/'.
11. true - if notification time has to be exact. (Battery draining, false by default)
12. Currently noop.

### ForegroundNotification

```ts
type ForegroundNotification = Notification & {
  remote: boolean; // true if it's push notification
};
```

### Channel

```ts
type Channel = {
  name: string;                            //1
  description?: string;                    //2
  priority?: string;                       //3
  sound?: boolean;                         //4
  vibrate?: boolean | number[];            //5
  badge?: boolean;                         //6
};
```

1. Channel name (used by android settings).
2. Channel description (used by android settings).
3. Notification priority. (range <1,5>)
4. True if notification should play sound. (false by default);
5. True - default vibration  (true by default)  
   False - no vibration  
   Array of numbers - custom vibration (example: [0, 500, 0, 500]).
6. True - will increase badge number and False otherwise. (True by default).   

### ActionType

```ts
type ActionType = {
  actionId: string;                        //1
  buttonTitle: string;                     //2
  isDestructive?: boolean;                 //3
  isAuthenticationRequired?: boolean;      //4
  doNotOpenInForeground?: boolean;         //5 
  textInput?: {
    submitButtonTitle: string;             //6  
    placeholder: string;                   //7
  };
};
```

1. Action id.
2. Title of notification button.
3. (iOS only) If this property is truthy, on iOS the button title will be highlighted (as if   
 [this native option](https://developer.apple.com/documentation/usernotifications/unnotificationactionoptions1648199-destructive) was set).
4. iOS only) If this property is truthy, triggering the action will require authentication from the user (as if [this native option](https://developer.apple.com/documentation/usernotifications/unnotificationactionoptions/1648196-authenticationrequired) was set).
5. (iOS only) If this property is truthy, triggering the action will not open the app in foreground (as if [this native option](https://developer.apple.com/documentation/usernotifications/unnotificationactionoptions/unnotificationactionoptionforeground) was **NOT** set).
6. Title of submit title.
7. Text to display in the text input field.


### UserInteraction

```ts
type UserInteraction = Notification & {
    actionId?: string;                     //1 
    userText?: string;                     //2
    remote?: boolean;                      //3
}
```

1. Id of action button that was tapped.  
2. Text tapped by user.
3. True if it is push notification.

### OnUserInteractionListener

```ts
type OnUserInteractionListener = (userInteraction: UserInteraction) => Promise<void>;
```

### OnForegroundNotificationListener

```ts
type OnForegroundNotificationListener = (notification: ForegroundNotification) => Promise<void>;
```

### OnTokenChangeListener

```ts
type OnTokenChangeListener = (token: string) => Promise<void>;
```

### Subscription
```ts
type Subscription = {
  remove: () => void;
}
```

## Push Notifications

### Expo as a middleman

[How to send Expo push notification](https://docs.expo.io/versions/v35.0.0/guides/push-notifications/#sending-notifications).

### Firebase Push Notifications

Firebase message format suitable for `expo-notifications`.

```json
{ 
    "message":{
        "token":"your_token",
        "data": {
            "title": "title",
            "message": "example content",
            "channelId": "channelId",
            "categoryId": "category",
            "icon": "icon",
            "color": "color",
            "body": "additional data",
            "sound": true/false
        }
    }
}
```

Note that Firebase message cannot contain "notification" property because it makes `expo-notifications` unable to display notification.

## Notification Icon (Android only)

> If you don't provide notification icon and try to display notification then app will crash!.

All you need to do is add notification icon as drawable resource under the name of `notification_icon`.
More about it [here](https://developer.android.com/studio/write/image-asset-studio).
