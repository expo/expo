[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-4BC51D.svg?style=flat)](https://github.com/Carthage/Carthage)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/hyperium/hyper/master/LICENSE)

# Branch Metrics iOS SDK Reference 

This is a repository of our open source iOS SDK, and the information presented here serves as a reference manual for our iOS SDK. See the table of contents below for a complete list of the content featured in this document.

___

## iOS Reference

1. External resources
  + [Full integration guide](https://dev.branch.io/getting-started/sdk-integration-guide/guide/ios/)
  + [Change log](https://github.com/BranchMetrics/ios-branch-deep-linking/blob/master/ChangeLog.md)
  + [Testing resources](https://dev.branch.io/getting-started/integration-testing/guide/ios/)
  + [Support portal](http://support.branch.io)
  + [Test app resources](#get-the-demo-app)

2. Getting started
  + [Library installation](#installation)
  + [Register for Branch key](#register-your-app)
  + [Add your Branch key](#add-your-branch-key-to-your-project)
  + [Register a URI scheme](#register-a-uri-scheme)
  + [Support Universal Links](#support-universal-linking-ios-9-and-above)

3. Branch general methods
  + [Get a Branch singleton](#get-a-singleton-branch-instance)
  + [Initialize Branch and register deep link router](#init-branch-session-and-deep-link-routing-function)
  + [Register view controller for auto deep linking](#register-a-deep-link-controller)
  + [Retrieve latest deep linking params](#retrieve-session-install-or-open-parameters)
  + [Retrieve the user's first deep linking params](#retrieve-install-install-only-parameters)
  + [Setting the user id for tracking influencers](#persistent-identities)
  + [Logging a user out](#logout)
  + [Tracking user actions and events](#tracking-user-actions-and-events)
  + [Apple Search Ad Attribution](#apple-search-ads)
  + [Enable or Disable User Tracking](#enable-or-disable-user-tracking)

4. Branch Universal Objects
  + [Instantiate a Branch Universal Object](#branch-universal-object)
  + [Tracking user interactions with an object](#tracking-user-interactions-with-an-object)
  + [List content on Spotlight](#list-content-on-spotlight)
  + [Configuring link properties](link-properties-parameters)
  + [Creating a short link referencing the object](#shortened-links)
  + [Triggering a share sheet to share a link](#uiactivityview-share-sheet)

5. Referral rewards methods
  + [Get reward balance](#get-reward-balance)
  + [Redeem rewards](#redeem-all-or-some-of-the-reward-balance-store-state)
  + [Get credit history](#get-credit-history)

___

## Get the Demo App

There's a full demo app embedded in this repository, but you can also check out our live demo: [Branch Monster Factory](https://itunes.apple.com/us/app/id917737838). We've [open sourced the Branchster's app](https://github.com/BranchMetrics/Branchster-iOS) as well if you're ready to dig in.

## Installation

_The iOS SDK footprint is 220kb by itself._

### Available in CocoaPods

Branch is available through [CocoaPods](http://cocoapods.org). To install it, simply add the following line to your Podfile:

```objc
pod 'Branch'
```

Then, from the command line, `cd` to your project directory, and do:

```
pod install
pod update
```

to install the Branch pod and update it to the latest version of the SDK.

Make sure to do the `pod update`.  CocoaPods may not use the latest version of the SDK otherwise!

### Carthage

To integrate Branch into your project using Carthage add the following to your `Cartfile`:

```ruby
github "BranchMetrics/ios-branch-deep-linking"
```

### Download the Raw Files

You can also install by downloading the raw files below.

* Download code from here:
[https://s3-us-west-1.amazonaws.com/branchhost/Branch-iOS-SDK.zip](https://s3-us-west-1.amazonaws.com/branchhost/Branch-iOS-SDK.zip)

* The testbed project:
[https://s3-us-west-1.amazonaws.com/branchhost/Branch-iOS-TestBed.zip](https://s3-us-west-1.amazonaws.com/branchhost/Branch-iOS-TestBed.zip)

##### Adding the Raw Files Branch SDK to Your Project

If you want to add the Branch SDK directly without using Cocoapods or Carthage, add Branch as a dynamic framework dependency to your project.

I'll add Branch to the project 'BareBones' as an example:

1. Download or git clone the Branch SDK files to your computer.

2. If you've already added Branch to your project, remove it.

3. In the Xcode project navigator view, select your project, right click, and select 'Add files to "\<your project name\>"...'

    ![Add Files...](docs/images/AddBranchProject-1-AddFiles.png "Add Files...")

4. The 'Add' file chooser will open.  Navigate to your 'ios-branch-deep-linking > carthage-files' directory and select the BranchSDK.xcodeproj project.

    ![Add BranchSDK.xcodeproj](docs/images/AddBranchProject-2-Choose-BranchSDK.png "Add BranchSDK.xcodeproj")

    Xcode will add BranchSDK.xcodeproj to your project.

5. In your project, reveal the 'BranchSDK.xcodeproj > Products' hierarchy. Then drag the Branch.framework product to the 'Embedded Binaries' section of your build product.

    ![Embed Binary](docs/images/AddBranchProject-3-Add-Framework.gif "Embed Binary")

6. Done! You can click on Build Phases of your project to make sure that Branch was added as a Target Dependency and is copied as an Embedded Framework.

    ![Check Build Phase](docs/images/AddBranchProject-4-BuildPhase.png "Check Build Phase")

### Register Your App

You can sign up for your own app id at [https://dashboard.branch.io](https://dashboard.branch.io).

### Add Your Branch Key to Your Project

After you register your app, your Branch Key can be retrieved on the [Settings](https://dashboard.branch.io/#/settings) page of the dashboard. Now you need to add it to YourProject-Info.plist (Info.plist for Swift).

1. In plist file, mouse hover "Information Property List," which is the root item under the Key column.
1. After about half a second, you will see a "+" sign appear. Click it.
1. In the newly added row, fill in "branch_key" for its key, leave type as String, and enter your app's Branch Key obtained in above steps in the value column.
1. Save the plist file.

![Branch Key Demo](docs/images/branch-key-plist.png)
If you want to add a key for both your live and test apps at the same time, you need change the type column to Dictionary, and add two entries inside:
1. For live app, use "live" (without double quotes) for key, String for type, and your live branch key for value.
2. For test app, use "test" (without double quotes) for key, String for type, and your test branch key for value.

![Branch Multi Key Demo](docs/images/branch-multi-key-plist.png)

Note: If you used Fabric to install Branch as a kit, your Branch keys will be in your Info.plist as an element under the Fabric > Kits array, like this:

![Branch Fabric Keys](docs/images/branch-fabric-key-plist.png)

### Register a URI Scheme

Register your app to respond to direct deep links (yourapp:// in a mobile browser) by adding a URI scheme in the YourProject-Info.plist file. Make sure to change **yourapp** to a unique string that represents your app name.

1. In Xcode, click on YourProject-Info.plist on the left.
1. Find URL Types and click the right arrow. (If it doesn't exist, right click anywhere and choose Add Row. Scroll down and choose URL Types).
1. Add "yourapp," where yourapp is a unique string for your app, as an item in URL Schemes as below.

   _Caution: Your apps URI scheme must be the first scheme defined (item 0) in the list._

   If you have multiple schemes defined, such as a Facebook login URI, make your app's URI scheme the first one in the list so the Branch SDK knows the URI specific to your app.

![URL Scheme Demo](https://s3-us-west-1.amazonaws.com/branchhost/urlScheme.png)


Alternatively, you can add the URI scheme in your project's Info page.

1. In Xcode, click your project in the Navigator (on the left side).
1. Select the "Info" tab.
1. Expand the "URL Types" section at the bottom.
1. Click the "+" sign to add a new URI Scheme, as below:

![URL Scheme Demo](https://s3-us-west-1.amazonaws.com/branchhost/urlType.png)

### Support Universal Linking (iOS 9 and Above)

With iOS 9, Apple has added the ability to allow http links to directly open your app, rather than using the URI Schemes. This can be a pain to set up, as it involves a complicated process on your server. The good news is that Branch does this work for you with just two steps!

1. In Xcode, click on your project in the Navigator (on the left side).
1. Select the "Capabilities" tab.
1. Expand the "Associated Domains" tab.
1. Enable the setting (toggle the switch).
1. Add `applinks:xxxx.app.link` and `applinks:xxxx-alternate.app.link` to the list. Make sure `xxxx` matches the 4 character subdomain for your app (you can find it on the [dashboard here](https://dashboard.branch.io/#/settings/link)). If you use a custom subdomain, use that in place of the x's (eg `imgur.app.link` and `imgur-alternate.app.link`).
1. Add any additional custom domains you have (e.g. `applinks:vng.io`)

![Xcode Enable UL](docs/images/xcode-ul-enable.png)

1. On the Dashboard, navigate to your app's link settings page.
1. Check the "Enable Universal Links
1. Ensure that your Apple Team ID and app Bundle ID are correct (we try to auto-harvest these for you).
1. Be sure to save these settings updates.

![Dashboard Enable UL](docs/images/dashboard-ul-enable.png)

#### Custom Domain Name Configuration (Required if you don't use the Branch provided xxxx.app.link domain)

Branch provides a xxxx.app.link domain for your app, but you can use your own custom domain for app links instead. If you _do_ use your own custom domain for your universal app links, you need to add it to your Info.plist.

Add the `branch_universal_link_domains` key with your custom domain as a string value:

![Custom Domain Info.plist](docs/images/custom-domain.png)

#### URI Scheme Considerations

The Branch SDK will pull the first URI Scheme from your list that is not one of `fb`, `db`, or `pin`. This value will be used one time to set the iOS URI Scheme under your Link Settings in the Branch Dashboard.

For additional help configuring the SDK, including step-by-step instructions, please see the [iOS Quickstart Guide](https://docs.branch.io/pages/apps/ios/).

### Get a Singleton Branch Instance

All Branch methods require an instance of the main Branch object. Here's how you can get one. It's stored statically and is accessible from any class.

#### Methods

###### Objective-C

```objc
Branch *branch = [Branch getInstance];
```

###### Swift

```swift
let branch: Branch = Branch.getInstance()
```

### Testing

#### Test your Branch Integration

Test your Branch Integration by calling `validateSDKIntegration` in your AppDelegate. Check your Xcode logs to make sure all the SDK Integration tests pass. Make sure to comment out or remove `validateSDKIntegration` in your production build.

```swift
Branch.getInstance().validateSDKIntegration()
```

```objc
[[Branch getInstance] validateSDKIntegration];
```

##### Test Deeplink routing for your Branch links

Append `?bnc_validate=true` to any of your app's Branch links and click it on your mobile device (not the Simulator!) to start the test. For instance, to validate a link like: `"https://<yourapp\>.app.link/NdJ6nFzRbK"` click on: `"https://<yourapp\>.app.link/NdJ6nFzRbK?bnc_validate=true"`

###### Objective-C

```objc
#warning Remove for launch
[Branch setUseTestBranchKey:YES];
```

###### Swift

```swift
//TODO: Remove for launch
Branch.useTestBranchKey = true
```

#### Parameters

**Branch key** (NSString *) _optional_
: If you don't store the Branch key in the plist file, you have the option of passing this key as an argument.


### Init Branch Session and Deep Link Routing Function

To deep link, Branch must initialize a session to check if the user originated from a link. This call will initialize a new session _every time the app opens_. 100% of the time the app opens, it will call the deep link handling block to inform you whether the user came from a link. If your app opens with keys in the params, you'll want to route the user depending on the data you passed in. Otherwise, send them to a generic screen.

#### Methods

###### Objective-C
```objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    Branch *branch = [Branch getInstance];
    [branch initSessionWithLaunchOptions:launchOptions andRegisterDeepLinkHandler:^(NSDictionary *params, NSError *error) {
    	// route the user based on what's in params
    }];
    return YES;
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
    BOOL branchHandled =
        [[Branch getInstance]
            application:application
                openURL:url
                options:options];
    if (!branchHandled) {
        // do other deep link routing for the Facebook SDK, Pinterest SDK, etc
    }
    return YES;
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *restorableObjects))restorationHandler {
    BOOL handledByBranch = [[Branch getInstance] continueUserActivity:userActivity];

    return handledByBranch;
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo {
    [[Branch getInstance] handlePushNotification:userInfo];
}
```

###### Swift
```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
  let branch: Branch = Branch.getInstance()
  branch?.initSession(launchOptions: launchOptions, deepLinkHandler: { params, error in
    if error == nil {
        // params are the deep linked params associated with the link that the user clicked -> was re-directed to this app
        print("params: %@", params.description)
    }
   })
  return true
}

func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    // Pass the url to the handle deep link call
    let branchHandled = Branch.getInstance().application(
        application,
        open: url,
        options: options
    )
    if (!branchHandled) {
        // If not handled by Branch, do other deep link routing for the
        // Facebook SDK, Pinterest SDK, etc
    }

    return true
}

func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    let handledByBranch = Branch.getInstance().continue(userActivity)

    return handledByBranch
}

func application(_ application: UIApplication, didReceiveRemoteNotification launchOptions: [AnyHashable: Any]) -> Void {
    Branch.getInstance().handlePushNotification(launchOptions)
}
```


Note:  If your application delegate declares the method:

```
- (BOOL) application:willFinishLaunchingWithOptions:
```

In Swift:

```
optional func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey : Any]? = nil) -> Bool
```

it must return ```YES``` for Branch to work.


#### Parameters

###### initSession

**launchOptions** (NSDictionary *) _required_
: These launch options are passed to Branch through didFinishLaunchingWithOptions and will notify us if the user originated from a URI call or not. If the app was opened from a URI like myapp://, we need to follow a special initialization routine.

**deepLinkHandler** ^(NSDictionary *params, NSError *error) _optional_
: This is the callback block that Branch will execute after a network call to determine where the user comes from. It is called 100% of the time the app opens up since Branch registers for lifecycle notifications.

- _NSDictionary *params_ : These params will contain any data associated with the Branch link that was clicked before the app session began. There are a few keys which are always present:
	- '+is_first_session' Denotes whether this is the first session (install) or any other session (open)
	- '+clicked_branch_link' Denotes whether or not the user clicked a Branch link that triggered this session
- _NSError *error_ : This error will be nil unless there is an error such as connectivity or otherwise. Check !error to confirm it was a valid link.
    - BNCServerProblemError There was an issue connecting to the Branch service
    - BNCBadRequestError The request was improperly formatted

Branch returns explicit parameters every time. Here is a list, and a description of what each represents.

* `~` denotes analytics
* `+` denotes information added by Branch
* (for the curious, `$` denotes reserved keywords used for controlling how the Branch service behaves)

| **Parameter** | **Meaning**
| --- | ---
| ~channel | The channel on which the link was shared, specified at link creation time
| ~feature | The feature, such as `invite` or `share`, specified at link creation time
| ~tags | Any tags, specified at link creation time
| ~campaign | The campaign the link is associated with, specified at link creation time
| ~stage | The stage, specified at link creation time
| ~creation_source | Where the link was created ('API', 'Dashboard', 'SDK', 'iOS SDK', 'Android SDK', or 'Web SDK')
| +match_guaranteed | True or false as to whether the match was made with 100% accuracy
| +referrer | The referrer for the link click, if a link was clicked
| +phone_number | The phone number of the user, if the user texted himself/herself the app
| +is_first_session | Denotes whether this is the first session (install) or any other session (open)
| +clicked_branch_link | Denotes whether or not the user clicked a Branch link that triggered this session
| +click_timestamp | Epoch timestamp of when the click occurred

**isReferrable** (BOOL) _optional_
: This boolean lets you control whether or not the user is eligible to be 'referred'. This is applicable for credits and influencer tracking. If isReferrable is set to NO | false, and the user clicks a link before entering the app, deep link parameters will appear, but that user will _not_ be considered referred. If isReferrable is set to YES | true, and the user clicks a link, deep link params will appear and the user _will_ be considered referred. Remove this argument to access the default, which only allows the user to be referred on a _fresh install_, but not on opens.

**automaticallyDisplayDeepLinkController** (BOOL) _optional_
: This boolean lets you control whether or not the Branch should attempt to launch Deep Linked controllers (based on those registered with `[branch registerDeepLinkController:forKey:]`). The default is NO | false.

###### handleDeepLink

**url** (NSString *) _required_
: This argument passes us the URI string so that we can parse the extra parameters. For example, 'myapp://open?link_click_id=12345'.

###### continueUserActivity

**userActivity** (NSUserActivity *) _required_
: This argument passes us the user activity so that we can parse the originating URL.

#### Returns

###### initSession

Nothing

###### handleDeepLink

**BOOL** handleDeepLink will return a boolean indicating whether Branch has handled the URI. If the URI call is 'myapp://open?link_click_id=12345', then handleDeepLink will return YES because the Branch click object is present. If just 'myapp://', handleDeepLink will return NO.

###### continueUserActivity

**BOOL** continueUserActivity will return a boolean indicating whether Branch has handled the Universal Link. If Universal Link is powered by Branch, then continueUserActivity will return YES because the Branch click object is present.

If you use your own custom universal link domain, make sure you add it your Info.plist under the `branch_universal_link_domains` key as described [here](#custom-domain-name-configuration) or this method may erroneously return `NO` when in fact the universal link will be opened.

### Register a Deep Link Controller

Register a controller for Branch to show when specific keys are present in the Branch open / install dictionary. This is the mechanism to handle auto deep linking and should be called before `initSession`.

#### Methods

###### Objective-C

```objc
[[Branch getInstance] registerDeepLinkController:myController forKey:@"my-key" withPresentation:BNCViewControllerOptionShow];
```

###### Swift

```swift
Branch.getInstance().registerDeepLinkController(myController forKey:"my-key" withPresentation: .optionShow)
```

#### Parameters

**controller** (UIViewController <BranchDeepLinkingController> *) _required_
: The controller to display when the key is present in the dictionary.

**key** (NSString *) _required_
: The key checked for in open / install dictionaries.

**Option** (BNCViewControllerPresentationOption) _required_
| **Option** | **Meaning**
| --- | ---
| BNCViewControllerOptionShow | This option pushes view controller onto the navigation stack in a similar way as the showViewController
| BNCViewControllerOptionPush | This option pushes view controller onto the navigation stack in a similar way as the pushViewController
| BNCViewControllerOptionPresent | This option presents view controller onto the root view controller of window in a similar way as the presentViewController

#### Returns

Nothing

### Retrieve session (install or open) parameters

These session parameters will be available at any point later on with this command. If no parameters are available then Branch will return an empty dictionary. This refreshes with every new session (app installs AND app opens).

Warning: If the Branch SDK is retrieving the latest session parameters via a network call, this method will return the *previous* session's parameters.  The best practice is to set a callback deep link handler at Branch initialization.  That handler will be called when a Branch deep link is handled and the most recent session parameters are available.

Otherwise, use the `getLatestReferringParamsSynchronous` method. This method always returns the latest session parameters.  The downside is that is may block the calling thread until the current results are available.

#### Methods

###### Objective-C

```objc
// This is an example of `getLatestReferringParams`.
// Warning: It may return the previous results.
NSDictionary *sessionParams = [[Branch getInstance] getLatestReferringParams];

// This is an example of `getLatestReferringParamsSynchronous`.
// Warning: It may block the current thread until the latest results are available.
NSDictionary *sessionParams = [[Branch getInstance] getLatestReferringParamsSynchronous];
```

###### Swift

```swift
// This is an example of `getLatestReferringParams`.
// Warning: It may return the previous results.
let sessionParams = Branch.getInstance().getLatestReferringParams()

// This is an example of `getLatestReferringParamsSynchronous`.
// Warning: It may block the current thread until the latest results are available.
let sessionParams = Branch.getInstance().getLatestReferringParamsSynchronous()
```

#### Parameters

None

#### Returns

`NSDictionary*`

When initSession returns a parameter set in the deep link callback, we store it in NSUserDefaults for the duration of the session in case you want to retrieve it later. Careful, once the app is minimized and the session ends, this will be cleared.

### Retrieve Install (Install Only) Parameters

If you ever want to access the original session params (the parameters passed in for the first install event only), you can use this line. This is useful if you only want to reward users who newly installed the app from a referral link. Note that these parameters can be updated when `setIdentity:` is called and identity merging occurs.

#### Methods

###### Objective-C

```objc
NSDictionary *installParams = [[Branch getInstance] getFirstReferringParams]; // previously getInstallReferringParams
```

###### Swift

```swift
let installParams = Branch.getInstance().getFirstReferringParams() // previously getInstallReferringParams
```

#### Parameters

None

### Persistent Identities

Often, you might have your own user IDs, or want referral and event data to persist across platforms or uninstall/reinstall. It's helpful if you know your users access your service from different devices. This where we introduce the concept of an 'identity'.

#### Methods

To identify a user, just call:

###### Objective-C

```objc
// previously identifyUser:
[[Branch getInstance] setIdentity:your user id];    // your user id should not exceed 127 characters
```

###### Swift

```swift
// previously identifyUser:
Branch.getInstance().setIdentity(your user id)  // your user id should not exceed 127 characters
```

#### Parameters

**identity** (NSString *) _required_
: This is the alias you'd like to label your user in the Branch system. Note that we only support a single alias per user.

### Logout

If you provide a logout function in your app, be sure to clear the user when the logout completes. This will ensure that all the stored parameters get cleared and all events are properly attributed to the right identity.

**Warning**: This call will clear the promo credits and attribution on the device.

#### Methods

###### Objective-C

```objc
[[Branch getInstance] logout];  // previously clearUser
```

###### Swift

```swift
Branch.getInstance().logout()   // previously clearUser
```

#### Parameters

None

### Tracking User Actions and Events

Use the `BranchEvent` interface to track special user actions or application specific events beyond app installs, opens, and sharing. You can track events such as when a user adds an item to an on-line shopping cart, or searches for a keyword, among others.

The `BranchEvent` interface provides an interface to add contents represented by BranchUniversalObject in order to associate app contents with events.

Analytics about your app's BranchEvents can be found on the Branch dashboard, and BranchEvents also provide tight integration with many third party analytics providers.

The `BranchEvent` class can be simple to use. For example:

###### Objective-C

```objc
[[BranchEvent standardEvent:BranchStandardEventAddToCart] logEvent];
```

###### Swift

```swift
BranchEvent.standardEvent(.addToCart).logEvent()
```

For best results use the Branch standard event names defined in `BranchEvent.h`. But you can use your own custom event names too:

###### Objective-C

```objc
[[BranchEvent customEventWithName:@"User_Scanned_Item"] logEvent];
```

###### Swift

```swift
BranchEvent.customEventWithName("User_Scanned_Item").logEvent()
```

Extra event specific data can be tracked with the event as well:

###### Objective-C

```objc
BranchEvent *event    = [BranchEvent standardEvent:BranchStandardEventPurchase];
event.transactionID   = @"tx-12344555";
event.currency        = BNCCurrencyUSD;
event.revenue         = [NSDecimalNumber decimalNumberWithString:@"12.70"];
event.shipping        = [NSDecimalNumber decimalNumberWithString:@"10.20"];
event.tax             = [NSDecimalNumber decimalNumberWithString:@"2.50"];
event.coupon          = @"coupon_code";
event.affiliation     = @"store_affiliation";
event.eventDescription= @"Shopper made a purchase.";
event.searchQuery     = @"Fashion Scarf";
event.contentItems    = @[ branchUniversalObject ];
event.customData      = (NSMutableDictionary*) @{
    @"Item_Color": @"Red",
    @"Item_Size":  @"Large"
};
[event logEvent];
```

###### Swift

```
let event = BranchEvent.standardEvent(.purchase)
event.transactionID    = "tx-12344555"
event.currency         = .USD
event.revenue          = 12.70
event.shipping         = 10.20
event.tax              = 2.50
event.coupon           = "coupon_code"
event.affiliation      = "store_affiliation"
event.eventDescription = "Shopper made a purchase."
event.searchQuery      = "Fashion Scarf"
event.contentItems     = [ branchUniversalObject ]
event.customData       = [
    "Item_Color": "Red",
    "Item_Size":  "Large"
]
event.logEvent()
```

### Register Custom Events (Deprecated)

**For Clients Using Referrals**

If you are using Branch's Referral feature, please use the legacy documentation provided below using the `userCompletedAction` methods. Do not upgrade to the new `BranchEvent` methods for tracking user actions mentioned above.

#### Methods

###### Objective-C (Deprecated)

```objc
[[Branch getInstance] userCompletedAction:@"your_custom_event"]; // your custom event name should not exceed 63 characters
```

###### Swift (Deprecated)

```swift
Branch.getInstance().userCompletedAction("your_custom_event") // your custom event name should not exceed 63 characters
```

OR if you want to store some state with the event:

###### Objective-C (Deprecated)

```objc
[[Branch getInstance] userCompletedAction:@"your_custom_event" withState:(NSDictionary *)appState]; // same 63 characters max limit
```

###### Swift (Deprecated)

```swift
Branch.getInstance().userCompletedAction("your_custom_action", withState: [String: String]()) // same 63 characters max limit; replace [String: String]() with params dictionary
```

Some example events you might want to track:

```objc
@"complete_purchase"
@"wrote_message"
@"finished_level_ten"
```

#### Parameters


**event** `(NSString *)` _required_
: This is the event string you'd like to send to Branch. You can view the attribution of which links drove events to occur in the analytics.

**state** `(NSDictionary *)` _optional_
: If you'd like to pass additional metadata along with the event, you should use this dictionary. For example, this is how you pass revenue into Branch using the BNCPurchaseAmount constant as a key.

### Apple Search Ads

Branch can help track your Apple Search Ad campaigns by fetching the search ad attribution from
Apple at app install.  You can then use the parameters you've set in the Apple Search Ad dashboard,
parameters such as the campaign name, and take special action in you app after an install, or simply
track the effectiveness of a campaign in the Branch dashboard, along with other your other Branch
statistics, such as total installs, referrals, and app link statistics.

* External resources
  + [Apple Search Ads](https://searchads.apple.com/)
  + [Apple Search Ads for Developers](https://developer.apple.com/app-store/search-ads/)
  + [Apple Search Ads WWDC](https://developer.apple.com/videos/play/wwdc2016/302/)

* Important: You must add the iAd.framework to your project to enable Apple Search Ad checking.

#### Methods

##### `- (void) delayInitToCheckForSearchAds`

Call this method to enable checking for Apple Search Ads before Branch initialization.  This method
must be called before you initialize your Branch session.

Note that this can add up to 10 seconds from call to initSession to callback due to Apple's latency.

###### Objective-C
```objc
[[Branch getInstance] delayInitToCheckForSearchAds];
```

###### Swift
```swift
Branch.getInstance().delayInitToCheckForSearchAds
```

##### `- (void) setAppleSearchAdsDebugMode`

The `setAppleSearchAdsDebugMode` method sets the SDK into Apple Search Ad debug mode.  In this mode
fake campaign params are returned 100% of the time.  This is for testing only.

Warning: This should not be used in production.

###### Objective-C
```objc
[[Branch getInstance] setAppleSearchAdsDebugMode];
```

###### Swift
```swift
Branch.getInstance().setAppleSearchAdsDebugMode
```

### Enable or Disable User Tracking
In order to comply with tracking requirements, you can disable tracking at the SDK level. Simply call:

```objc
[Branch setTrackingDisabled:YES];
```

```swift
Branch.setTrackingDisabled(true)
```

This will prevent any Branch network requests from being sent, except when deep linking. If someone clicks a Branch link, but does not want to be tracked, we will return the deep linking data back to the app but without capturing any tracking information.

In do-not-track mode, you will still be able to create & share links. The links will not have identifiable information and will be long format links. Event tracking won’t pass data back to the server if a user has expressed to not be tracked. You can change this behavior at any time by calling the above function. The trackingDisabled state is saved and persisted across app runs.

## Branch Universal Object (for deep links, content analytics and indexing)

As more methods have evolved in iOS, we've found that it was increasingly hard to manage them all. We abstracted as many as we could into the concept of a Branch Universal Object. This is the object that is associated with the thing you want to share (content or user). You can set all the metadata associated with the object and then call action methods on it to get a link or index in Spotlight.

### Branch Universal Object best practices

Here are a set of best practices to ensure that your analytics are correct, and your content is ranking on Spotlight effectively.

1. Set the `canonicalIdentifier` to a unique, de-duped value across instances of the app
2. Ensure that the `title`, `contentDescription` and `imageUrl` properly represent the object
3. Initialize the Branch Universal Object and call `userCompletedAction` with the `BNCRegisterViewEvent` **on page load**
4. Call `showShareSheet` and `createShortLink` later in the life cycle, when the user takes an action that needs a link
5. Call the additional object events (purchase, share completed, etc) when the corresponding user action is taken
6. Set the `contentIndexMode` to `ContentIndexModePublic` or `ContentIndexModePrivate`. If BranchUniversalObject is set to `ContentIndexModePublic`, then content would indexed using `NSUserActivity`, or else content would be index using `CSSearchableIndex` on Spotlight.

Note: Content indexed using `CSSearchableItem` could be removed from Spotlight but cannot be removed if indexed using `NSUserActivity`.

Practices to _avoid_:
1. Don't set the same `title`, `contentDescription` and `imageUrl` across all objects.
2. Don't wait to initialize the object and register views until the user goes to share.
3. Don't wait to initialize the object until you conveniently need a link.
4. Don't create many objects at once and register views in a `for` loop.

### Branch Universal Object

#### Methods and Properties

###### Objective-C

```objc
#import "BranchUniversalObject.h"
```

```objc
BranchUniversalObject *branchUniversalObject = [[BranchUniversalObject alloc] initWithCanonicalIdentifier:@"item/12345"];
branchUniversalObject.title = @"My Content Title";
branchUniversalObject.contentDescription = @"My Content Description";
branchUniversalObject.imageUrl = @"https://example.com/mycontent-12345.png";
branchUniversalObject.contentMetadata.contentSchema = BranchContentSchemaCommerceProduct;
branchUniversalObject.contentMetadata.customMetadata[@"property1"] = @"blue";
branchUniversalObject.contentMetadata.customMetadata[@"property2"] = @"red";
```

###### Swift

```swift
let branchUniversalObject: BranchUniversalObject = BranchUniversalObject(canonicalIdentifier: "item/12345")
branchUniversalObject.title = "My Content Title"
branchUniversalObject.contentDescription = "My Content Description"
branchUniversalObject.imageUrl = "https://example.com/mycontent-12345.png"
branchUniversalObject.contentMetadata.contentSchema = .product;
branchUniversalObject.contentMetadata.customMetadata["property1"] = "blue"
branchUniversalObject.contentMetadata.customMetadata["property2"] = "red"
```

#### Properties

**canonicalIdentifier**: This is the unique identifier for content that will help Branch de-dupe across many instances of the same thing. If you have a website with pathing, feel free to use that. Or if you have database identifiers for entities, use those.

**title**: This is the name for the content and will automatically be used for the OG tags. It will insert `$og_title` into the data dictionary of any link created.

**contentDescription**: This is the description for the content and will automatically be used for the OG tags. It will insert `$og_description` into the data dictionary of any link created.

**imageUrl**: This is the image URL for the content and will automatically be used for the OG tags. It will insert `$og_image_url` into the data dictionary of any link created.

**keywords**: Key words that describe the object. These are used for Spotlight search and web scraping so that users can find your content.

**locallyIndex**: If set to true, Branch will index this content on Spotlight on the user's phone.

**publiclyIndex**: If set to true, Branch will index this content on Google, Branch, etc.

**expirationDate**: The date when the content will not longer be available or valid. Currently, this is only used for Spotlight indexing but will be used by Branch in the future.

**contentMetadata**: Details that further describe your content. Set the properties of this sub-object depending on the type of content that is relevant to your content:

#### BranchUniversalObject.contentMetadata

The `BranchUniversalObject.contentMetadata` properties further describe  your content. These properties are trackable in the Branch dashboard and will be automatically exported to your connected third-party app intelligence partners like Adjust or Mixpanel.

Set the properties of this sub-object depending on the type of content that is relevant to your content. The `BranchUniversalObject.contentMetadata.contentSchema` property describes the type of object content. Set other properties as is relevant to the type.

**contentMetadata.contentSchema**: Set this property to a `BranchContentSchema` enum that best describes the content type. It accepts values like `BranchContentSchemaCommerceProduct` and `BranchContentSchemaMediaImage`.

**contentMetadata.customMetadata**: This dictionary contains any extra parameters you'd like to associate with the Branch Universal Object. These will be made available to you after the user clicks the link and opens up the app.

**contentMetadata.price**: The price of the item to be used in conjunction with the commerce related events below.

**contentMetadata.currency**: The currency representing the price in [ISO 4217 currency code](http://en.wikipedia.org/wiki/ISO_4217). The default is USD.

**contentMetadata.quantity**: The quantity.

**contentMetadata.sku**: The vendor SKU.

**contentMetadata.productName**: Product name.

**contentMetadata.productBrand**: Product brand.

**contentMetadata.productCategory**: The `BNCProductCategory` value, such as `BNCProductCategoryAnimalSupplies` or `BNCProductCategoryFurniture`.

**contentMetadata.productVariant**: The product variant.

**contentMetadata.condition**: The `BranchCondition` value, such as `BranchConditionNew` or `BranchConditionRefurbished`.

**ratingAverage, ratingCount, ratingMax**: The rating for your content.

**addressStreet, addressCity, addressRegion, addressCountry, addressPostalCode**: The address of your content.

**latitude, longitude**: The longitude and latitude of your content.

**imageCaptions**: Image captions for the content's images.

### Tracking User Interactions With An Object

We've added a series of custom events that you'll want to start tracking for rich analytics and targeting. Here's a list below with a sample snippet that calls the register view event.

| Key | Value
| --- | ---
| BranchStandardEventViewItem | User viewed the object
| BranchStandardEventAddToWishlist | User added the object to their wishlist
| BranchStandardEventAddToCart | User added object to cart
| BranchStandardEventInitiatePurchase | User started to check out
| BranchStandardEventPurchase | User purchased the item
| BranchStandardEventShare | User completed a share

#### Methods

###### Objective-C

```objc
[branchUniversalObject userCompletedAction:BranchStandardEventViewItem];
```

###### Swift

```swift
branchUniversalObject.userCompletedAction(BranchStandardEventViewItem)
```

#### Parameters

None

#### Returns

None

### Shortened Links

Once you've created your `Branch Universal Object`, which is the reference to the content you're interested in, you can then get a link back to it with the mechanisms described below.

#### Encoding Note

One quick note about encoding. Since `NSJSONSerialization` supports a limited set of classes, we do some custom encoding to allow additional types. Current supported types include `NSDictionary`, `NSArray`, `NSURL`, `NSString`, `NSNumber`, `NSNull`, and `NSDate` (encoded as an ISO8601 string with timezone). If a parameter is of an unknown type, it will be ignored.

#### Methods

###### Objective-C

```objc
#import "BranchLinkProperties.h"
```

```objc
BranchLinkProperties *linkProperties = [[BranchLinkProperties alloc] init];
linkProperties.feature = @"sharing";
linkProperties.channel = @"facebook";
[linkProperties addControlParam:@"$desktop_url" withValue:@"http://example.com/home"];
[linkProperties addControlParam:@"$ios_url" withValue:@"http://example.com/ios"];
```

```objc
[branchUniversalObject getShortUrlWithLinkProperties:linkProperties andCallback:^(NSString *url, NSError *error) {
    if (!error) {
        NSLog(@"success getting url! %@", url);
    }
}];
```

###### Swift

```swift
let linkProperties: BranchLinkProperties = BranchLinkProperties()
linkProperties.feature = "sharing"
linkProperties.channel = "facebook"
linkProperties.addControlParam("$desktop_url", withValue: "http://example.com/home")
linkProperties.addControlParam("$ios_url", withValue: "http://example.com/ios")
```

```swift
branchUniversalObject.getShortUrl(with: linkProperties) { (url, error) in
    if error == nil {
        NSLog("got my Branch link to share: %@", url)
    }
}
```

#### Link Properties Parameters

**channel**: The channel for the link. Examples could be Facebook, Twitter, SMS, etc., depending on where it will be shared.

**feature**: The feature the generated link will be associated with. Eg. `sharing`.

**controlParams**: A dictionary to use while building up the Branch link. Here is where you specify custom behavior controls as described in the table below.

You can do custom redirection by inserting the following _optional keys in the dictionary_:

| Key | Value
| --- | ---
| "$fallback_url" | Where to send the user for all platforms when app is not installed. Note that Branch will forward all robots to this URL, overriding any OG tags entered in the link.
| "$desktop_url" | Where to send the user on a desktop or laptop. By default it is the Branch-hosted text-me service.
| "$android_url" | The replacement URL for the Play Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_.
| "$ios_url" | The replacement URL for the App Store to send the user if they don't have the app. _Only necessary if you want a mobile web splash_.
| "$ipad_url" | Same as above, but for iPad Store.
| "$fire_url" | Same as above, but for Amazon Fire Store.
| "$blackberry_url" | Same as above, but for Blackberry Store.
| "$windows_phone_url" | Same as above, but for Windows Store.
| "$after_click_url" | When a user returns to the browser after going to the app, take them to this URL. _iOS only; Android coming soon_.

You have the ability to control the direct deep linking of each link by inserting the following _optional keys in the dictionary_:

| Key | Value
| --- | ---
| "$deeplink_path" | The value of the deep link path that you'd like us to append to your URI. For example, you could specify "$deeplink_path": "radio/station/456" and we'll open the app with the URI "yourapp://radio/station/456?link_click_id=branch-identifier". This is primarily for supporting legacy deep linking infrastructure.
| "$always_deeplink" | true or false. (default is not to deep link first) This key can be specified to have our linking service force try to open the app, even if we're not sure the user has the app installed. If the app is not installed, we fall back to the respective app store or $platform_url key. By default, we only open the app if we've seen a user initiate a session in your app from a Branch link (has been cookied and deep linked by Branch).

**alias**: The alias for a link. Eg. `myapp.com/customalias`

**matchDuration**: The attribution window in seconds for clicks coming from this link.

**stage**: The stage used for the generated link, indicating what part of a funnel the user is in.

**tags**: An array of tag strings to be associated with the link.

#### Get Short Url Parameters

**linkProperties**: The link properties created above that describe the type of link you'd like

**callback**: The callback that is called with url on success, or an error if something went wrong. Note that we'll return a link 100% of the time. Either a short one if network was available or a long one if it was not.

### UIActivityView Share Sheet

UIActivityView is the standard way of allowing users to share content from your app. Once you've created your `Branch Universal Object`, which is the reference to the content you're interested in, you can then automatically share it _without having to create a link_ using the mechanism below.

**Sample UIActivityView Share Sheet**

![UIActivityView Share Sheet](https://dev.branch.io/img/pages/getting-started/branch-universal-object/ios_share_sheet.png)

The Branch iOS SDK includes a wrapper on the UIActivityViewController, that will generate a Branch short URL and automatically tag it with the channel the user selects (Facebook, Twitter, etc.). Note that certain channels restrict access to certain fields. For example, Facebook prohibits you from pre-populating a message.

#### Methods

###### Objective-C

```objc
#import "BranchLinkProperties.h"
```

```objc
BranchLinkProperties *linkProperties = [[BranchLinkProperties alloc] init];
linkProperties.feature = @"sharing";
[linkProperties addControlParam:@"$desktop_url" withValue:@"http://example.com/home"];
[linkProperties addControlParam:@"$ios_url" withValue:@"http://example.com/ios"];
```

```objc
[branchUniversalObject showShareSheetWithLinkProperties:linkProperties
                                           andShareText:@"Super amazing thing I want to share!"
                                     fromViewController:self
                                             completion:^(NSString *activityType, BOOL completed){
    NSLog(@"finished presenting");
}];
```

###### Swift

```swift
let linkProperties: BranchLinkProperties = BranchLinkProperties()
linkProperties.feature = "sharing"
linkProperties.addControlParam("$desktop_url", withValue: "http://example.com/home")
linkProperties.addControlParam("$ios_url", withValue: "http://example.com/ios")
```

```swift
branchUniversalObject.showShareSheet(with: linkProperties,
                                     andShareText: "Super amazing thing I want to share!",
                                     from: self) { (activityType, completed) in
    NSLog("done showing share sheet!")
}
```

#### Show Share Sheet Parameters

**linkProperties**: The feature the generated link will be associated with.

**andShareText**: A dictionary to use while building up the Branch link.

**fromViewController**:

**completion**:

#### Further Customization

The majority of share options only include one string of text, except email, which has a subject and a body. The share text will fill in the body and you can specify the email subject in the link properties as shown below.

```objc
[linkProperties addControlParam:@"$email_subject" withValue:@"This one weird trick."];
```

```swift
linkProperties.addControlParam("$email_subject", withValue: "Therapists hate him.")
```

You can also optionally add HTML to the email option and customize the link text. If the link text is left out, the url itself is used

```objc
[linkProperties addControlParam:@"$email_html_header" withValue:@"<style>your awesome CSS</style>\nOr Dear Friend,"];
[linkProperties addControlParam:@"$email_html_footer" withValue:@"Thanks!"];
[linkProperties addControlParam:@"$email_html_link_text" withValue:@"Tap here"];
```

```swift
linkProperties.addControlParam("$email_html_header", withValue: "<style>your awesome CSS</style>\nOr Dear Friend,")
linkProperties.addControlParam("$email_html_footer", withValue: "Thanks!")
linkProperties.addControlParam("$email_html_link_text", withValue: "Tap here")
```

#### Changing share text on the fly

You can change the link shareText and other link parameters based on the choice the user makes on the sharesheet activity.  First, set the `BranchShareLink` delegate with an object that follows the `BranchShareLinkDelegate` protocol.

The optional `- (void) branchShareLinkWillShare:` delegate method will be called just after the user selects a share action, like share by email for instance, and before the share action is shown to the user, like when the email composer is shown to the user with the share text. This is an ideal time to change the share text based on the user action.

The optional `- (void) branchShareLink:didComplete:withError:` delegate method will be called after the user has completed the share action.  The `didComplete` boolean will be `YES` if the user shared the item, and `NO` if the user cancelled.  The `error` value will indicate any errors that may have occurred.

###### Objective-C
```objc
@interface ViewController () <BranchShareLinkDelegate>
```
Override the branchShareLinkWillShare function to change your shareText

```objc
- (void) branchShareLinkWillShare:(BranchShareLink*)shareLink {
    // Link properties, such as alias or channel can be overridden here based on the users'
    // choice stored in shareSheet.activityType.
    shareLink.shareText = [NSString stringWithFormat:
        @"Shared through '%@'\nfrom Branch's Branch-TestBed\nat %@.",
        shareLink.linkProperties.channel,
        [self.dateFormatter stringFromDate:[NSDate date]]];
}
```
###### Swift

```swift
class ViewController: UITableViewController, BranchShareLinkDelegate
```

Override the branchShareLinkWillShare function to change your shareText

```swift
func branchShareLinkWillShare(_ shareLink: BranchShareLink) {
	// Link properties, such as alias or channel can be overridden here based on the users'
	// choice stored in shareSheet.activityType.
	shareLink.shareText =
	    "Shared through '\(shareLink.linkProperties.channel!)'\nfrom Branch's TestBed-Swift" +
	    "\nat \(self.dateFormatter().string(from: Date()))."
}
```

#### Returns

None

### List Content On Spotlight

If you'd like to list your Branch Universal Object in Spotlight local and cloud index, this is the method you'll call. You'll want to register views every time the page loads as this contributes to your global ranking in search.

#### Methods

###### Objective-C

```objc
branchUniversalObject.automaticallyListOnSpotlight = YES;
[branchUniversalObject userCompletedAction:BranchStandardEventViewItem];
```

###### Swift

```swift
branchUniversalObject.automaticallyListOnSpotlight = true
branchUniversalObject.userCompletedAction(BranchStandardEventViewItem)
```

#### Parameters

**callback**: Will return the URL that was used to list the content in Spotlight if you'd like to store it for your own records.

#### Returns

None

### List Content On Spotlight with Link properties

If you'd like to list your Branch Universal Object with link properties in Spotlight local and cloud index, this is the method you'll call. You'll want to register views every time the page loads as this contributes to your global ranking in search.

#### Methods

###### Objective-C

```objc
[universalObject listOnSpotlightWithLinkProperties:linkProperties callback:^(NSString * _Nullable url, NSError * _Nullable error) {
    if (!error) {
         NSLog(@"Successfully indexed on spotlight");
    }
}];
```

###### Swift

```swift
universalObject.listOnSpotlight(with: linkProperty) { (url, error) in
    if (error == nil) {
        print("Successfully indexed on spotlight")
    }
}
```

#### Parameters

**callback**: Will return the URL that was used to list the content in Spotlight if you'd like to store it for your own records.

#### Returns

None

### List Multiple Branch Universal Objects On Spotlight using CSSearchableIndex

Call this method on the Branch shared instance to list multiple Branch Universal Objects in Spotlight:

#### Methods

###### Objective-C

```objc
[[Branch getInstance] indexOnSpotlightUsingSearchableItems:universalObjects
                                                    completion:^(NSArray<BranchUniversalObject *> *universalObjects,
                                                                 NSError *error) {
        if (!error) {
            // Successfully able to index all the BUO on spotloght
        }
    }];
```

###### Swift

```swift
Branch.getInstance().indexOnSpotlight(usingSearchableItems: universalObjects,
                                                completion: { (universalObjects, error) in
      if (error) {
           // Successfully able to index all the BUO on spotloght
      }
})
```

#### Parameters

**universalObjects**: An array of all the Branch Universal Object that would indexed using `CSSearchableIdex`

**completion**: Will return Branch Universal Object with dynamic urls as Spotlight identifier when indexing completes.

#### Returns

None

### Remove Branch Universal Object from Spotlight if privately indexed

Privately indexed Branch Universal Object can be removed from spotlight

#### Methods

###### Objective-C

```objc
[universalObject removeFromSpotlightWithCallback:^(NSError * _Nullable error) {
        if (!error) {
            NSLog(@"universal Object removed from spotlight");
        }
    }];
```

###### Swift

```swift
universalObject.removeFromSpotlight { (error) in
            if(error == nil) {
                print("BUO successfully removed")
            }
        }
```

#### Parameters

**Callback**: Will return once Branch Universal Object is removed from spotlight. If spotlight is removed, the spotlightIdentifier variable of Branch Universal Object would be nil.

#### Returns

None

### Remove multiple Branch Universal Objects from Spotlight if privately indexed

Privately indexed multiple Branch Universal Objects can be removed from spotlight

#### Methods

###### Objective-C

```objc
[[Branch getInstance] removeSearchableItemsWithBranchUniversalObjects:@[BUO1,BUO2] callback:^(NSError *error) {
    if (!error) {
        NSLog(@"An array of BUOs removed from spotlight");
    }
}]

```

###### Swift

```swift
Branch.getInstance().removeSearchableItems(with: [BUO1,BUO2]) { (error) in
    if (error == nil) {
        print("An array of BUOs removed from spotlight")
    }
}
```

#### Parameters

**Callback**: Will return once all Branch Universal Object is removed from spotlight. If spotlight is removed, the spotlightIdentifier variable of all Branch Universal Object would be nil.

#### Returns

None

### Remove all Branch Universal Objects from Spotlight if privately indexed

All Privately indexed Branch Universal Objects can be removed from spotlight

#### Methods

###### Objective-C

```objc
[[Branch getInstance] removeAllPrivateContentFromSpotLightWithCallback:^(NSError *error) {
    if (!error) {
      NSLog(@"All branch privately indexed content removed from spotlight");
    }
}];
```

###### Swift

```swift
Branch.getInstance().removeAllPrivateContentFromSpotLight { (error) in
    if (error == nil) {
        print("All branch privately indexed content removed from spotlight")
    }
}
```

#### Parameters

**Callback**: Will return once all Branch Universal Object is removed from spotlight.
Note: SpotlightIdentifer would not be nil of all the Branch Universal Object been removed from spotlight as Branch SDK doesn't cache the Branch Universal Objects.

#### Returns

None

## Referral System Rewarding Functionality

### Get Reward Balance

Reward balances change randomly on the backend when certain actions are taken (defined by your rules), so you'll need to make an asynchronous call to retrieve the balance. Here is the syntax:

#### Methods

###### Objective-C

```objc
[[Branch getInstance] loadRewardsWithCallback:^(BOOL changed, NSError *error) {
    // changed boolean will indicate if the balance changed from what is currently in memory

    // will return the balance of the current user's credits
    NSInteger credits = [[Branch getInstance] getCredits];
}];
```

###### Swift

```swift
Branch.getInstance().loadRewards { (changed, error) in
    // changed boolean will indicate if the balance changed from what is currently in memory

    // will return the balance of the current user's credits
    let credits = Branch.getInstance().getCredits()
}
```

#### Parameters

**callback**: The callback that is called once the request has completed.

### Redeem All or Some of the Reward Balance (Store State)

Redeeming credits allows users to cash in the credits they've earned. Upon successful redemption, the user's balance will be updated reflecting the deduction.

#### Methods

###### Objective-C

```objc
// Save that the user has redeemed 5 credits
[[Branch getInstance] redeemRewards:5];
```

###### Swift

```swift
// Save that the user has redeemed 5 credits
Branch.getInstance().redeemRewards(5)
```

#### Parameters

**amount**: The number of credits being redeemed.

### Get Credit History

This call will retrieve the entire history of credits and redemptions from the individual user. To use this call, implement like so:

#### Methods

###### Objective-C

```objc
[[Branch getInstance] getCreditHistoryWithCallback:^(NSArray *history, NSError *error) {
    if (!error) {
        // process history
    }
}];
```

###### Swift

```swift
Branch.getInstance().getCreditHistory { (creditHistory, error) in
    if error == nil {
        // process history
    }
}
```

The response will return an array that has been parsed from the following JSON:

```json
[
    {
        "transaction": {
                           "date": "2014-10-14T01:54:40.425Z",
                           "id": "50388077461373184",
                           "bucket": "default",
                           "type": 0,
                           "amount": 5
                       },
        "event" : {
            "name": "event name",
            "metadata": { your event metadata if present }
        },
        "referrer": "12345678",
        "referree": null
    },
    {
        "transaction": {
                           "date": "2014-10-14T01:55:09.474Z",
                           "id": "50388199301710081",
                           "bucket": "default",
                           "type": 2,
                           "amount": -3
                       },
        "event" : {
            "name": "event name",
            "metadata": { your event metadata if present }
        },
        "referrer": null,
        "referree": "12345678"
    }
]
```
#### Parameters

**referrer**
: The id of the referring user for this credit transaction. Returns null if no referrer is involved. Note this id is the user id in a developer's own system that's previously passed to Branch's identify user API call.

**referree**
: The id of the user who was referred for this credit transaction. Returns null if no referree is involved. Note this id is the user id in a developer's own system that's previously passed to Branch's identify user API call.

**type**
: This is the type of credit transaction.

1. _0_ - A reward that was added automatically by the user completing an action or promo.
1. _1_ - A reward that was added manually.
2. _2_ - A redemption of credits that occurred through our API or SDKs.
3. _3_ - This is a very unique case where we will subtract credits automatically when we detect fraud.
