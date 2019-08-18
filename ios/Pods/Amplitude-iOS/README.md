Amplitude iOS SDK
====================
An iOS SDK for tracking events and revenue to [Amplitude](http://www.amplitude.com).

[![Circle CI](https://circleci.com/gh/amplitude/Amplitude-iOS.svg?style=shield&circle-token=e1b2a7d2cd6dd64ac3643bc8cb2117c0ed5cbb75)](https://circleci.com/gh/amplitude/Amplitude-iOS/tree/master)
[![CocoaPods](https://img.shields.io/cocoapods/v/Amplitude-iOS.svg?style=flat)](http://cocoadocs.org/docsets/Amplitude-iOS/)
[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)

A [demo application](https://github.com/amplitude/iOS-Demo) is available to show a simple integration.

A [demo application](https://github.com/amplitude/iOS-Extension-Demo) is available to show a simple integration in iOS extensions.

See our [SDK documentation](https://rawgit.com/amplitude/Amplitude-iOS/v3.14.1/documentation/html/index.html) for a description of all available SDK methods and classes.

Our iOS SDK also supports tvOS. See [below](https://github.com/amplitude/Amplitude-iOS#tvos) for more information.

# Setup #
1. If you haven't already, go to https://amplitude.com and register for an account. You will receive an API Key.

2. [Download the source code](https://github.com/amplitude/Amplitude-iOS/archive/master.zip) and extract the zip file.

    Alternatively, you can pull directly from GitHub. If you use CocoaPods, add the following line to your Podfile: `pod 'Amplitude-iOS', '~> 3.14.1'`. If you are using CocoaPods, you may skip steps 3 and 4.

    You also have the option to install using Carthage. If you are using Carthage, add the following line to your Cartfile: `github "amplitude/Amplitude-iOS"`. Just add `#import <Amplitude/Amplitude.h>` to import all of the Amplitude header files.

3. Copy the `Amplitude` sub-folder into the source of your project in Xcode. Check "Copy items into destination group's folder (if needed)".

4. Amplitude's iOS SDK requires the SQLite library, which is included in iOS but requires an additional build flag to enable. In your project's `Build Settings` and your Target's `Build Settings`, under `Linking` -> `Other Linker Flags`, add the flag `-lsqlite3.0`.

5. In every file that uses analytics, import Amplitude.h at the top:
    ``` objective-c
    #import "Amplitude.h"
    ```

6. In the application:didFinishLaunchingWithOptions: method of your YourAppNameAppDelegate.m file, initialize the SDK:
    ``` objective-c
    [[Amplitude instance] initializeApiKey:@"YOUR_API_KEY_HERE"];
    ```

7. To track an event anywhere in the app, call:
    ``` objective-c
    [[Amplitude instance] logEvent:@"EVENT_IDENTIFIER_HERE"];
    ```

8. Events are saved locally. Uploads are batched to occur every 30 events and every 30 seconds, as well as on app close. After calling logEvent in your app, you will immediately see data appear on the Amplitude Website.

# Tracking Events #

It's important to think about what types of events you care about as a developer. You should aim to track between 20 and 200 types of events on your site. Common event types are actions the user initiates (such as pressing a button) and events you want the user to complete (such as filling out a form, completing a level, or making a payment).

Here are some resources to help you with your instrumentation planning:
  * [Event Tracking Quick Start Guide](https://amplitude.zendesk.com/hc/en-us/articles/207108137).
  * [Event Taxonomy and Best Practices](https://amplitude.zendesk.com/hc/en-us/articles/211988918).

Having large amounts of distinct event types, event properties and user properties, however, can make visualizing and searching of the data very confusing. By default we only show the first:
  * 1000 distinct event types
  * 2000 distinct event properties
  * 1000 distinct user properties

Anything past the above thresholds will not be visualized. **Note that the raw data is not impacted by this in any way, meaning you can still see the values in the raw data, but they will not be visualized on the platform.**

A single call to `logEvent` should not have more than 1000 event properties. Likewise a single call to `setUserProperties` should not have more than 1000 user properties. If the 1000 item limit is exceeded then the properties will be dropped and a warning will be logged. We have put in very conservative estimates for the event and property caps which we don’t expect to be exceeded in any practical use case. If you feel that your use case will go above those limits please reach out to support@amplitude.com.

# Tracking Sessions #

A session is a period of time that a user has the app in the foreground. Sessions within 5 minutes of each other are merged into a single session. In the iOS SDK, sessions are tracked automatically. When the SDK is initialized, it determines whether the app is launched into the foreground or background and starts a new session if launched in the foreground. A new session is created when the app comes back into the foreground after being out of the foreground for 5 minutes or more. If the app is in the background and an event is logged, then a new session is created if more than 5 minutes has passed since the app entered the background or when the last event was logged (whichever occured last). Otherwise the background event logged will be part of the current session.

You can adjust the time window for which sessions are extended by changing the variable minTimeBetweenSessionsMillis:
``` objective-c
[Amplitude instance].minTimeBetweenSessionsMillis = 30 * 60 * 1000; // 30 minutes
[[Amplitude instance] initializeApiKey:@"YOUR_API_KEY_HERE"];
```

By default start and end session events are no longer sent. To renable add this line before initializing the SDK:
``` objective-c
[[Amplitude instance] setTrackingSessionEvents:YES];
[[Amplitude instance] initializeApiKey:@"YOUR_API_KEY_HERE"];
```

You can also log events as out of session. Out of session events have a session_id of -1 and are not considered part of the current session, meaning they do not extend the current session. This might be useful for example if you are logging events triggered by push notifications. You can log events as out of session by setting input parameter outOfSession to true when calling logEvent.

``` objective-c
[[Amplitude instance] logEvent:@"EVENT_IDENTIFIER_HERE" withEventProperties:nil outOfSession:true];
```

You can also log identify events as out of session by setting input parameter `outOfSession` to `YES` when calling identify:

``` objective-c
AMPIdentify *identify = [[AMPIdentify identify] set:@"key" value:@"value"];
[[Amplitude instance] identify:identify outOfSession:YES];
```

### Getting the Session Id ###

You can use the helper method `getSessionId` to get the value of the current sessionId:
``` objective-c
long long sessionId = [[Amplitude instance] getSessionId];
```

# Setting Custom User IDs #

If your app has its own login system that you want to track users with, you can call `setUserId:` at any time:

``` objective-c
[[Amplitude instance] setUserId:@"USER_ID_HERE"];
```

You can also add the user ID as an argument to the `initializeApiKey:` call:

``` objective-c
[[Amplitude instance] initializeApiKey:@"YOUR_API_KEY_HERE" userId:@"USER_ID_HERE"];
```

### Logging Out and Anonymous Users ###
If a user logs out, or you want to log the events under an anonymous user, you need to do 2 things: 1) set the userId to `nil` 2) regenerate a new deviceId. After doing that, events coming from the current user/device will appear as a brand new user in Amplitude dashboards. Note: if you choose to do this, you won't be able to see that the 2 users were using the same device.

``` objective-c
[[Amplitude instance] setUserId:nil];  // not string nil
[[Amplitude instance] regenerateDeviceId];
```


# Setting Event Properties #

You can attach additional data to any event by passing a NSDictionary object as the second argument to logEvent:withEventProperties:

``` objective-c
NSMutableDictionary *eventProperties = [NSMutableDictionary dictionary];
[eventProperties setValue:@"VALUE_GOES_HERE" forKey:@"KEY_GOES_HERE"];
[[Amplitude instance] logEvent:@"Compute Hash" withEventProperties:eventProperties];
```

Note: the keys should be of type NSString, and the values should be of type NSString, NSNumber, NSArray, NSDictionary, or NSNull. You will see a warning if you try to use an unsupported type.

# User Properties and User Property Operations #

The SDK supports the operations set, setOnce, unset, and add on individual user properties. The operations are declared via a provided `AMPIdentify` interface. Multiple operations can be chained together in a single `AMPIdentify` object. The `AMPIdentify` object is then passed to the Amplitude client to send to the server. The results of the operations will be visible immediately in the dashboard, and take effect for events logged after. Note, each
operation on the `AMPIdentify` object returns the same instance, allowing you to chain multiple operations together.

To use the `AMPIdentify` interface, you will first need to include the header:
``` objective-c
#import "AMPIdentify.h"
```

1. `set`: this sets the value of a user property.

    ``` objective-c
    AMPIdentify *identify = [[[AMPIdentify identify] set:@"gender" value:@"female"] set:@"age" value:[NSNumber numberForInt:20]];
    [[Amplitude instance] identify:identify];
    ```

2. `setOnce`: this sets the value of a user property only once. Subsequent `setOnce` operations on that user property will be ignored. In the following example, `sign_up_date` will be set once to `08/24/2015`, and the following setOnce to `09/14/2015` will be ignored:

    ``` objective-c
    AMPIdentify *identify1 = [[AMPIdentify identify] setOnce:@"sign_up_date" value:@"09/06/2015"];
    [[Amplitude instance] identify:identify1];

    AMPIdentify *identify2 = [[AMPIdentify identify] setOnce:@"sign_up_date" value:@"10/06/2015"];
    [[Amplitude instance] identify:identify2];
    ```

3. `unset`: this will unset and remove a user property.

    ``` objective-c
    AMPIdentify *identify = [[[AMPIdentify identify] unset:@"gender"] unset:@"age"];
    [[Amplitude instance] identify:identify];
    ```

4. `add`: this will increment a user property by some numerical value. If the user property does not have a value set yet, it will be initialized to 0 before being incremented.

    ``` objective-c
    AMPIdentify *identify = [[[AMPIdentify identify] add:@"karma" value:[NSNumber numberWithFloat:0.123]] add:@"friends" value:[NSNumber numberWithInt:1]];
    [[Amplitude instance] identify:identify];
    ```

5. `append`: this will append a value or values to a user property. If the user property does not have a value set yet, it will be initialized to an empty list before the new values are appended. If the user property has an existing value and it is not a list, it will be converted into a list with the new value appended.

    ``` objective-c
    NSMutableArray *array = [NSMutableArray array];
    [array addObject:@"some_string"];
    [array addObject:[NSNumber numberWithInt:56]];
    AMPIdentify *identify = [[[AMPIdentify identify] append:@"ab-tests" value:@"new-user-test"] append:@"some_list" value:array];
    [[Amplitude instance] identify:identify];
    ```

6. `prepend`: this will prepend a value or values to a user property. Prepend means inserting the value(s) at the front of a given list. If the user property does not have a value set yet, it will be initialized to an empty list before the new values are prepended. If the user property has an existing value and it is not a list, it will be converted into a list with the new value prepended.

    ``` objective-c
    NSMutableArray *array = [NSMutableArray array];
    [array addObject:@"some_string"];
    [array addObject:[NSNumber numberWithInt:56]];
    AMPIdentify *identify = [[[AMPIdentify identify] append:@"ab-tests" value:@"new-user-test"] prepend:@"some_list" value:array];
    [[Amplitude instance] identify:identify];
    ```

Note: if a user property is used in multiple operations on the same `Identify` object, only the first operation will be saved, and the rest will be ignored. In this example, only the set operation will be saved, and the add and unset will be ignored:

``` objective-c
AMPIdentify *identify = [[[[AMPIdentify identify] set:@"karma" value:[NSNumber numberWithInt:10]] add:@"friends" value:[NSNumber numberWithInt:1]] unset:@"karma"];
    [[Amplitude instance] identify:identify];
```

### Arrays in User Properties ###

The SDK supports arrays in user properties. Any of the user property operations above (with the exception of `add`) can accept an NSArray or an NSMutableArray. You can directly `set` arrays, or use `append` to generate an array.

``` objective-c
NSMutableArray *colors = [NSMutableArray array];
[colors addObject:@"rose"];
[colors addObject:@"gold"];
NSMutableArray *numbers = [NSMutableArray array];
[numbers addObject:[NSNumber numberWithInt:4]];
[numbers addObject:[NSNumber numberWithInt:5]];
AMPIdentify *identify = [[[[AMPIdentify identify] set:@"colors" value:colors] append:@"ab-tests" value:@"campaign_a"] append:@"existing_list" value:numbers];
[[Amplitude instance] identify:identify];
```

### Setting Multiple Properties with `setUserProperties` ###

You may use `setUserProperties` shorthand to set multiple user properties at once. This method is simply a wrapper around `AMPIdentify set` and `identify`.

``` objective-c
NSMutableDictionary *userProperties = [NSMutableDictionary dictionary];
[userProperties setValue:@"VALUE_GOES_HERE" forKey:@"KEY_GOES_HERE"];
[userProperties setValue:@"OTHER_VALUE_GOES_HERE" forKey:@"OTHER_KEY_GOES_HERE"];
[[Amplitude instance] setUserProperties:userProperties];
```

### Clearing User Properties with `clearUserProperties` ###

You may use `clearUserProperties` to clear all user properties at once. Note: the result is irreversible!

``` objective-c
[[Amplitude instance] clearUserProperties];
```

# Allowing Users to Opt Out

To stop all event and session logging for a user, call setOptOut:

``` objective-c
[[Amplitude instance] setOptOut:YES];
```

Logging can be restarted by calling setOptOut again with enabled set to NO.
No events will be logged during any period opt out is enabled, even after opt
out is disabled.

# Tracking Revenue #

The preferred method of tracking revenue for a user now is to use `logRevenueV2` in conjunction with the provided `AMPRevenue` interface. `AMPRevenue` instances will store each revenue transaction and allow you to define several special revenue properties (such as revenueType, productIdentifier, etc) that are used in Amplitude dashboard's Revenue tab. You can now also add event properties to the revenue event, via the eventProperties field. These `AMPRevenue` instance objects are then passed into `logRevenueV2` to send as revenue events to Amplitude servers. This allows us to automatically display data relevant to revenue on the Amplitude website, including average revenue per daily active user (ARPDAU), 1, 7, 14, 30, 60, and 90 day revenue, lifetime value (LTV) estimates, and revenue by advertising campaign cohort and daily/weekly/monthly cohorts.

**Important Note**: Amplitude currently does not support currency conversion. All revenue data should be normalized to your currency of choice, before being sent to Amplitude.

To use the `Revenue` interface, you will first need to import the class:
``` objective-c
#import "AMPRevenue.h"
```

Each time a user generates revenue, you create a `AMPRevenue` object and fill out the revenue properties:
``` objective-c
AMPRevenue *revenue = [[[AMPRevenue revenue] setProductIdentifier:@"productIdentifier"] setQuantity:3];
[revenue setPrice:[NSNumber numberWithDouble:3.99]];
[[Amplitude instance] logRevenueV2:revenue];
```

`price` is a required field. `quantity` defaults to 1 if not specified. `receipt` is required if you want to verify the revenue event. Each field has a corresponding `set` method (for example `setProductId`, `setQuantity`, etc). This table describes the different fields available:

| Name               | Type         | Description                                                                                                  | default |
|--------------------|--------------|--------------------------------------------------------------------------------------------------------------|---------|
| productId          | NSString     | Optional: an identifier for the product (can be pulled from `SKPaymentTransaction.payment.productIdentifier`)| nil     |
| quantity           | NSInteger    | Required: the quantity of products purchased. Defaults to 1 if not specified. Revenue = quantity * price     | 1       |
| price              | NSNumber     | Required: the price of the products purchased (can be negative). Revenue = quantity * price                  | nil     |
| revenueType        | NSString     | Optional: the type of revenue (ex: tax, refund, income)                                                      | nil     |
| receipt            | NSData       | Optional: required if you want to verify the revenue event                                                   | nil     |
| eventProperties    | NSDictionary | Optional: a NSDictionary of event properties to include in the revenue event                                 | nil     |

Note: the price can be negative, which might be useful for tracking revenue lost, for example refunds or costs. Also note, you can set event properties on the revenue event just like you would with logEvent by passing in an NSDictionary of string key value pairs. These event properties, however, will only appear in the Event Segmentation tab, not in the Revenue tab.

### Revenue Verification ###

By default Revenue events recorded on the iOS SDK appear in Amplitude dashboards as unverified revenue events. **To enable revenue verification, copy your iTunes Connect In App Purchase Shared Secret into the manage section of your app on Amplitude. You must put a key for every single app in Amplitude where you want revenue verification.**

Then after a successful purchase transaction, add the receipt data to the `Revenue` object:

``` objective-c
AMPRevenue *revenue = [[[AMPRevenue revenue] setProductIdentifier:@"productIdentifier"] setQuantity:1];
[[revenue setPrice:[NSNumber numberWithDouble:3.99]] setReceipt:receiptData];
[[Amplitude instance] logRevenueV2:revenue];
```

`receipt:` the receipt NSData from the app store. For details on how to obtain the receipt data, see [Apple's guide on Receipt Validation](https://developer.apple.com/library/ios/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateRemotely.html#//apple_ref/doc/uid/TP40010573-CH104-SW1).

### Backwards compatibility ###

The existing `logRevenue` methods still work but are deprecated. Fields such as `revenueType` will be missing from events logged with the old methods, so Revenue segmentation on those events will be limited in Amplitude dashboards.

# Tracking Events to Multiple Amplitude Apps #

The Amplitude iOS SDK supports logging events to multiple Amplitude apps (multiple API keys). If you want to log events to multiple Amplitude apps, you need to use separate instances for each Amplitude app. Each new instance created will have its own apiKey, userId, deviceId, and settings.

You will need to assign a name to each Amplitude app / instance, and use that name consistently when fetching that instance to call functions. **IMPORTANT: Once you have chosen a name for that instance you cannot change it.** Every instance's data and settings are tied to its name, and you will need to continue using that instance name for all future versions of your app to maintain data continuity, so chose your instance names carefully. Note these names do not need to correspond to the names of your apps in the Amplitude dashboards, but they need to remain consistent throughout your code. You also need to be sure that each instance is initialized with the correct apiKey.

Instance names must be nonnil and nonempty strings. The names are case-insensitive. You can fetch each instance by name by calling `[Amplitude instanceWithName:@"INSTANCE_NAME"]`.

As mentioned before, each new instance created will have its own apiKey, userId, deviceId, and settings. **You will have to reconfigure all the settings for each instance.** For example if you want to track session events you would have to call `setTrackingSessionEvents:YES` on each instance. This does give you the freedom to have different settings for each instance.

### Backwards Compatibility - Upgrading from a Single Amplitude App to Multiple Apps ###

If you were tracking users with a single app before v3.6.0, you might be wondering what will happen to existing data, existing settings, and returning users (users who already have a deviceId and/or userId). All of the historical data and settings are maintained on the `default` instance, which is fetched without an instance name: `[Amplitude instance]`. This is the way you are used to interacting with the Amplitude SDK, which means all of your existing tracking code should work as before.

### Example of how to Set Up and Log Events to Two Separate Apps ###

``` objective-c
[[Amplitude instance] initializeApiKey:@"12345"]; // existing app, existing settings, and existing API key
[[Amplitude instanceWithName:@"new_app"] initializeApiKey:@"67890"]; // new app, new API key

[[Amplitude instanceWithName:@"new_app"] setUserId:@"joe@gmail.com"]; // need to reconfigure new app
[[Amplitude instanceWithName:@"new_app"] logEvent:@"Clicked"];

AMPIdentify *identify = [[AMPIdentify identify] add:@"karma" value:[NSNumber numberWithInt:1]];
[[Amplitude instance] identify:identify];
[[Amplitude instance] logEvent:@"Viewed Home Page"];
```

### Synchronizing Device Ids Between Apps ###

As mentioned before, each new instance will have its own deviceId. If you want your apps to share the same deviceId, you can do so *after initialization* via the `getDeviceId` and `setDeviceId` methods. Here's an example of how to copy the existing deviceId to the `new_app` instance:
``` objective-c
NSString *deviceId = [[Amplitude instance] getDeviceId]; // existing deviceId
[[Amplitude instanceWithName:@"new_app"] setDeviceId:deviceId]; // transferring existing deviceId to new app
```

# tvOS #

This SDK will work with tvOS apps. Follow the same [setup instructions](https://github.com/amplitude/Amplitude-iOS#setup) for iOS apps.

One thing to note: tvOS apps do not have persistent storage (only temporary storage), so for tvOS the SDK is configured to upload events immediately as they are logged (`eventUploadThreshold` is set to 1 by default for tvOS). It is assumed that Apple TV devices have a stable internet connection, so uploading events immediately is reasonable. If you wish to revert back to the iOS batching behavior, you can do so by changing `eventUploadThreshold` (set to 30 by default for iOS):
``` objective-c
[[Amplitude instance] setEventUploadThreshold:30];
```

# Swift #

This SDK will work with Swift. If you are copying the source files or using CocoaPods without the `use_frameworks!` directive, you should create a bridging header as documented [here](https://developer.apple.com/library/ios/documentation/Swift/Conceptual/BuildingCocoaApps/MixandMatch.html) and add the following line to your bridging header:

``` objective-c
#import "Amplitude.h"
```

If you have `use_frameworks!` set, you should not use a bridging header and instead use the following line in your swift files:

``` swift
import Amplitude_iOS
```

In either case, you can call Amplitude methods with `Amplitude.instance().method(...)`

# Advanced #
This SDK automatically grabs useful data from the phone, including app version, phone model, operating system version, and carrier information.

### Setting Groups ###

Amplitude supports assigning users to groups, and performing queries such as Count by Distinct on those groups. An example would be if you want to group your users based on what organization they are in by using an orgId. You can designate Joe to be in orgId 10, while Sue is in orgId 15. When performing an event segmentation query, you can then select Count by Distinct orgIds to query the number of different orgIds that have performed a specific event. As long as at least one member of that group has performed the specific event, that group will be included in the count. See our help article on [Count By Distinct](https://amplitude.zendesk.com/hc/en-us/articles/218824237) for more information.

When setting groups you need to define a `groupType` and `groupName`(s). In the above example, 'orgId' is a `groupType`, and the value 10 or 15 is the `groupName`. Another example of a `groupType` could be 'sport' with `groupNames` like 'tennis', 'baseball', etc.

You can use `setGroup` to designate which groups a user belongs to. Note: this will also set the `groupType`: `groupName` as a user property. **This will overwrite any existing groupName value set for that user's groupType, as well as the corresponding user property value.** `groupType` is a string, and `groupName` can be either a string or an array of strings to indicate a user being in multiple groups (for example Joe is in orgId 10 and 16, so the `groupName` would be [10, 16]).

You can also call `setGroup` multiple times with different groupTypes to track multiple types of groups. **You are allowed to track up to 5 different groupTypes per app.** For example Sue is in orgId: 15, and she also plays sport: soccer. Now when querying, you can Count by Distinct on both orgId and sport (although as separate queries). Any additional groupTypes after the limit will be ignored from the Count By Distinct query UI, although they will still be saved as user properties.

```objective-c
[[Amplitude instance] setGroup:@"orgId" groupName:[NSNumber numberWithInt:15]];
[[Amplitude instance] setGroup:@"sport" groupName:[NSArray arrayWithObjects: @"tennis", @"soccer", nil];
```

You can also use `logEvent` withGroups: to set event-level groups, meaning the group designation only applies for the specific event being logged and does not persist on the user (unless you explicitly set it with `setGroup`). The group input is a dictionary of groupType: groupName pairs, where groupTypes are strings and groupName can either be strings or array of strings.

```objective-c
NSDictionary *eventProperties = [NSDictionary dictionaryWithObjectsAndKeys: @"value", @"key", nil];
NSDictionary *groups = [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithInt:10], @"orgId", @"soccer", @"sport", nil];

[[Amplitude instance] logEvent:@"initialize_game" withEventProperties:eventProperties withGroups:groups];
```

### Location Tracking ###
If the user has granted your app location permissions, the SDK will also grab the location of the user. Amplitude will never prompt the user for location permissions itself, this must be done by your app.

Amplitude only polls for a location once on startup of the app, once on each app open, and once when the permission is first granted. There is no continuous tracking of location, although you can force Amplitude to grab the latest location by calling `[[Amplitude instance] updateLocation]`. Note this does consume more resources on the user's device, so use this wisely.

If you wish to disable location tracking done by the app, you can call `[[Amplitude instance] disableLocationListening]` at any point. If you want location tracking disabled on startup of the app, call disableLocationListening before you call `initializeApiKey:`. You can always reenable location tracking through Amplitude with `[[Amplitude instance] enableLocationListening]`.

### Custom Device IDs ###
Device IDs are set to the Identifier for Vendor (IDFV) if available, otherwise they are randomly generated. You can, however, choose to instead use the Advertising Identifier (IDFA) if available by calling `[[Amplitude instance] useAdvertisingIdForDeviceId]` before initializing with your API key. You can also retrieve the Device ID that Amplitude uses with `[[Amplitude instance] getDeviceId]`.

If you have your own system for tracking device IDs and would like to set a custom device ID, you can do so with `[[Amplitude instance] setDeviceId:@"CUSTOM_DEVICE_ID"];` **Note: this is not recommended unless you really know what you are doing.** Make sure the device ID you set is sufficiently unique (we recommend something like a UUID - see `[AMPUtils generateUUID]` for an example on how to generate) to prevent conflicts with other devices in our system.

### ARC ###
This code will work with both ARC and non-ARC projects. Preprocessor macros are used to determine which version of the compiler is being used.

### SSL pinning ###
The SDK includes support for SSL pinning. It is enabled via a preprocessor macro.

If you installed the SDK using Cocoapods, you will need to enable the preprocessor macro via your Podfile by adding this post install hook:
```ruby
post_install do |installer_representation|
    installer_representation.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'AMPLITUDE_SSL_PINNING=1']
        end
    end
end
```

If you installed the SDK directly from the source, you can enable SSL pinning by adding the following preprocessor macro: `AMPLITUDE_SSL_PINNING=1`

### iOS Extensions ###
The SDK allows for tracking in iOS Extensions. Follow the [Setup instructions](https://github.com/amplitude/amplitude-ios#setup). In Step 6, instead of initializing the SDK in `application:didFinishLaunchingWithOptions:`, you initialize the SDK in your extension's `viewDidLoad` method.

Couple of things to note:

1. The `viewDidLoad` method will get called every time your extension is opened. This means that our SDK's `initializeApiKey` method will get called every single time; however, that's okay since it will safely ignore subsequent calls after the first one. If you want you can protect the initialization with something like a dispatch_once block.

2. Our definition of sessions was intended for an application use case. Depending on your expected extension use case, you might want to not enable `trackingSessionEvents`, or extend the `minTimeBetweenSessionsMillis` to be longer than 5 minutes. You should experiment with these 2 settings to get your desired session definition.

3. Also, you may want to decrease `eventUploadPeriodSeconds` to something shorter than 30 seconds to upload events at shorter intervals if you don't expect users to keep your extension open that long. You can also manually call `[[Amplitude instance] uploadEvents];` to manually force an upload.

Here is a simple [demo application](https://github.com/amplitude/iOS-Extension-Demo) showing how to instrument the iOS SDK in an extension.

### Debug Logging ###
By default only critical errors are logged to console. To enable debug logging, change `AMPLITUDE_DEBUG` from `0` to `1` at the top of the Objective-C file you wish to examine.

Error messages are printed by default. To disable error logging, change `AMPLITUDE_LOG_ERRORS` from `1` to `0` in `Amplitude.m`.
