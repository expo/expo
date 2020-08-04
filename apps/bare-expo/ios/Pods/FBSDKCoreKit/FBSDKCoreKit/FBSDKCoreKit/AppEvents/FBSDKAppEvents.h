// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <Foundation/Foundation.h>

#if !TARGET_OS_TV
#import <WebKit/WebKit.h>
#endif

#import <FBSDKCoreKit/FBSDKGraphRequestConnection.h>

NS_ASSUME_NONNULL_BEGIN

@class FBSDKAccessToken;
@class FBSDKGraphRequest;

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

/**  NSNotificationCenter name indicating a result of a failed log flush attempt. The posted object will be an NSError instance. */
FOUNDATION_EXPORT NSNotificationName const FBSDKAppEventsLoggingResultNotification
NS_SWIFT_NAME(AppEventsLoggingResult);

#else

/**  NSNotificationCenter name indicating a result of a failed log flush attempt. The posted object will be an NSError instance. */
FOUNDATION_EXPORT NSString *const FBSDKAppEventsLoggingResultNotification
NS_SWIFT_NAME(AppEventsLoggingResultNotification);

#endif

/**  optional plist key ("FacebookLoggingOverrideAppID") for setting `loggingOverrideAppID` */
FOUNDATION_EXPORT NSString *const FBSDKAppEventsOverrideAppIDBundleKey
NS_SWIFT_NAME(AppEventsOverrideAppIDBundleKey);

/**

 NS_ENUM (NSUInteger, FBSDKAppEventsFlushBehavior)

  Specifies when `FBSDKAppEvents` sends log events to the server.

 */
typedef NS_ENUM(NSUInteger, FBSDKAppEventsFlushBehavior)
{

  /** Flush automatically: periodically (once a minute or every 100 logged events) and always at app reactivation. */
  FBSDKAppEventsFlushBehaviorAuto = 0,

  /** Only flush when the `flush` method is called. When an app is moved to background/terminated, the
   events are persisted and re-established at activation, but they will only be written with an
   explicit call to `flush`. */
  FBSDKAppEventsFlushBehaviorExplicitOnly,
} NS_SWIFT_NAME(AppEvents.FlushBehavior);

/**
  NS_ENUM(NSUInteger, FBSDKProductAvailability)
    Specifies product availability for Product Catalog product item update
 */
typedef NS_ENUM(NSUInteger, FBSDKProductAvailability)
{
  /**
   * Item ships immediately
   */
  FBSDKProductAvailabilityInStock = 0,
  /**
   * No plan to restock
   */
  FBSDKProductAvailabilityOutOfStock,
  /**
   * Available in future
   */
  FBSDKProductAvailabilityPreOrder,
  /**
   * Ships in 1-2 weeks
   */
  FBSDKProductAvailabilityAvailableForOrder,
  /**
   * Discontinued
   */
  FBSDKProductAvailabilityDiscontinued,
} NS_SWIFT_NAME(AppEvents.ProductAvailability);

/**
 NS_ENUM(NSUInteger, FBSDKProductCondition)
 Specifies product condition for Product Catalog product item update
 */
typedef NS_ENUM(NSUInteger, FBSDKProductCondition)
{
  FBSDKProductConditionNew = 0,
  FBSDKProductConditionRefurbished,
  FBSDKProductConditionUsed,
} NS_SWIFT_NAME(AppEvents.ProductCondition);

/**
 @methodgroup Predefined event names for logging events common to many apps.  Logging occurs through the `logEvent` family of methods on `FBSDKAppEvents`.
 Common event parameters are provided in the `FBSDKAppEventsParameterNames*` constants.
 */

/// typedef for FBSDKAppEventName
typedef NSString *const FBSDKAppEventName NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(AppEvents.Name);

/** Log this event when the user has achieved a level in the app. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameAchievedLevel;

/** Log this event when the user has entered their payment info. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameAddedPaymentInfo;

/** Log this event when the user has added an item to their cart.  The valueToSum passed to logEvent should be the item's price. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameAddedToCart;

/** Log this event when the user has added an item to their wishlist.  The valueToSum passed to logEvent should be the item's price. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameAddedToWishlist;

/** Log this event when a user has completed registration with the app. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameCompletedRegistration;

/** Log this event when the user has completed a tutorial in the app. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameCompletedTutorial;

/** Log this event when the user has entered the checkout process.  The valueToSum passed to logEvent should be the total price in the cart. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameInitiatedCheckout;

/** Log this event when the user has completed a transaction.  The valueToSum passed to logEvent should be the total price of the transaction. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNamePurchased;

/** Log this event when the user has rated an item in the app.  The valueToSum passed to logEvent should be the numeric rating. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameRated;

/** Log this event when a user has performed a search within the app. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameSearched;

/** Log this event when the user has spent app credits.  The valueToSum passed to logEvent should be the number of credits spent. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameSpentCredits;

/** Log this event when the user has unlocked an achievement in the app. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameUnlockedAchievement;

/** Log this event when a user has viewed a form of content in the app. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameViewedContent;

/** A telephone/SMS, email, chat or other type of contact between a customer and your business. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameContact;

/** The customization of products through a configuration tool or other application your business owns. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameCustomizeProduct;

/** The donation of funds to your organization or cause. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameDonate;

/** When a person finds one of your locations via web or application, with an intention to visit (example: find product at a local store). */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameFindLocation;

/** The booking of an appointment to visit one of your locations. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameSchedule;

/** The subsequent subscriptions after the start of a paid subscription for a product or service you offer. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameSubscriptionHeartbeat __attribute((deprecated("This attribute is no longer used.")));

/** The start of a free trial of a product or service you offer (example: trial subscription). */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameStartTrial;

/** The submission of an application for a product, service or program you offer (example: credit card, educational program or job). */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameSubmitApplication;

/** The start of a paid subscription for a product or service you offer. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameSubscribe;

/** Log this event when the user views an ad. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameAdImpression;

/** Log this event when the user clicks an ad. */
FOUNDATION_EXPORT FBSDKAppEventName FBSDKAppEventNameAdClick;

/**
 @methodgroup Predefined event name parameters for common additional information to accompany events logged through the `logEvent` family
 of methods on `FBSDKAppEvents`.  Common event names are provided in the `FBAppEventName*` constants.
 */

/// typedef for FBSDKAppEventParameterName
typedef NSString *const FBSDKAppEventParameterName NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(AppEvents.ParameterName);

 /**
  * Parameter key used to specify data for the one or more pieces of content being logged about.
  * Data should be a JSON encoded string.
  * Example:
  * "[{\"id\": \"1234\", \"quantity\": 2, \"item_price\": 5.99}, {\"id\": \"5678\", \"quantity\": 1, \"item_price\": 9.99}]"
  */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameContent;

/** Parameter key used to specify an ID for the specific piece of content being logged about.  Could be an EAN, article identifier, etc., depending on the nature of the app. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameContentID;

/** Parameter key used to specify a generic content type/family for the logged event, e.g. "music", "photo", "video".  Options to use will vary based upon what the app is all about. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameContentType;

/** Parameter key used to specify currency used with logged event.  E.g. "USD", "EUR", "GBP".  See ISO-4217 for specific values.  One reference for these is <http://en.wikipedia.org/wiki/ISO_4217>. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameCurrency;

/** Parameter key used to specify a description appropriate to the event being logged.  E.g., the name of the achievement unlocked in the `FBAppEventNameAchievementUnlocked` event. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameDescription;

/** Parameter key used to specify the level achieved in a `FBAppEventNameAchieved` event. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameLevel;

/** Parameter key used to specify the maximum rating available for the `FBAppEventNameRate` event.  E.g., "5" or "10". */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameMaxRatingValue;

/** Parameter key used to specify how many items are being processed for an `FBAppEventNameInitiatedCheckout` or `FBAppEventNamePurchased` event. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameNumItems;

/** Parameter key used to specify whether payment info is available for the `FBAppEventNameInitiatedCheckout` event.  `FBSDKAppEventParameterValueYes` and `FBSDKAppEventParameterValueNo` are good canonical values to use for this parameter. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNamePaymentInfoAvailable;

/** Parameter key used to specify method user has used to register for the app, e.g., "Facebook", "email", "Twitter", etc */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameRegistrationMethod;

/** Parameter key used to specify the string provided by the user for a search operation. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameSearchString;

/** Parameter key used to specify whether the activity being logged about was successful or not.  `FBSDKAppEventParameterValueYes` and `FBSDKAppEventParameterValueNo` are good canonical values to use for this parameter. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameSuccess;

/**
 @methodgroup Predefined event name parameters for common additional information to accompany events logged through the `logProductItem` method on `FBSDKAppEvents`.
 */

/// typedef for FBSDKAppEventParameterProduct
typedef NSString *const FBSDKAppEventParameterProduct NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(AppEvents.ParameterProduct);

/** Parameter key used to specify the product item's category. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductCategory;

/** Parameter key used to specify the product item's custom label 0. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductCustomLabel0;

/** Parameter key used to specify the product item's custom label 1. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductCustomLabel1;

/** Parameter key used to specify the product item's custom label 2. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductCustomLabel2;

/** Parameter key used to specify the product item's custom label 3. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductCustomLabel3;

/** Parameter key used to specify the product item's custom label 4. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductCustomLabel4;

/** Parameter key used to specify the product item's AppLink app URL for iOS. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIOSUrl;

/** Parameter key used to specify the product item's AppLink app ID for iOS App Store. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIOSAppStoreID;

/** Parameter key used to specify the product item's AppLink app name for iOS. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIOSAppName;

/** Parameter key used to specify the product item's AppLink app URL for iPhone. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIPhoneUrl;

/** Parameter key used to specify the product item's AppLink app ID for iPhone App Store. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIPhoneAppStoreID;

/** Parameter key used to specify the product item's AppLink app name for iPhone. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIPhoneAppName;

/** Parameter key used to specify the product item's AppLink app URL for iPad. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIPadUrl;

/** Parameter key used to specify the product item's AppLink app ID for iPad App Store. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIPadAppStoreID;

/** Parameter key used to specify the product item's AppLink app name for iPad. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkIPadAppName;

/** Parameter key used to specify the product item's AppLink app URL for Android. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkAndroidUrl;

/** Parameter key used to specify the product item's AppLink fully-qualified package name for intent generation. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkAndroidPackage;

/** Parameter key used to specify the product item's AppLink app name for Android. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkAndroidAppName;

/** Parameter key used to specify the product item's AppLink app URL for Windows Phone. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkWindowsPhoneUrl;

/** Parameter key used to specify the product item's AppLink app ID, as a GUID, for App Store. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkWindowsPhoneAppID;

/** Parameter key used to specify the product item's AppLink app name for Windows Phone. */
FOUNDATION_EXPORT FBSDKAppEventParameterProduct FBSDKAppEventParameterProductAppLinkWindowsPhoneAppName;

/*
 @methodgroup Predefined values to assign to event parameters that accompany events logged through the `logEvent` family
 of methods on `FBSDKAppEvents`.  Common event parameters are provided in the `FBSDKAppEventParameterName*` constants.
 */

/// typedef for FBSDKAppEventParameterValue
typedef NSString *const FBSDKAppEventParameterValue NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(AppEvents.ParameterValue);

/** Yes-valued parameter value to be used with parameter keys that need a Yes/No value */
FOUNDATION_EXPORT FBSDKAppEventParameterValue FBSDKAppEventParameterValueYes;

/** No-valued parameter value to be used with parameter keys that need a Yes/No value */
FOUNDATION_EXPORT FBSDKAppEventParameterValue FBSDKAppEventParameterValueNo;

/** Parameter key used to specify the type of ad in an FBSDKAppEventNameAdImpression
 * or FBSDKAppEventNameAdClick event.
 * E.g. "banner", "interstitial", "rewarded_video", "native" */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameAdType;

/** Parameter key used to specify the unique ID for all events within a subscription
 * in an FBSDKAppEventNameSubscribe or FBSDKAppEventNameStartTrial event. */
FOUNDATION_EXPORT FBSDKAppEventParameterName FBSDKAppEventParameterNameOrderID;

/*
 @methodgroup Predefined values to assign to user data store
 */

/// typedef for FBSDKAppEventUserDataType
typedef NSString *const FBSDKAppEventUserDataType NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(AppEvents.UserDataType);

/** Parameter key used to specify user's email. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventEmail;

/** Parameter key used to specify user's first name. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventFirstName;

/** Parameter key used to specify user's last name. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventLastName;

/** Parameter key used to specify user's phone. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventPhone;

/** Parameter key used to specify user's date of birth. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventDateOfBirth;

/** Parameter key used to specify user's gender. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventGender;

/** Parameter key used to specify user's city. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventCity;

/** Parameter key used to specify user's state. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventState;

/** Parameter key used to specify user's zip. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventZip;

/** Parameter key used to specify user's country. */
FOUNDATION_EXPORT FBSDKAppEventUserDataType FBSDKAppEventCountry;

/**


  Client-side event logging for specialized application analytics available through Facebook App Insights
 and for use with Facebook Ads conversion tracking and optimization.



 The `FBSDKAppEvents` static class has a few related roles:

 + Logging predefined and application-defined events to Facebook App Insights with a
 numeric value to sum across a large number of events, and an optional set of key/value
 parameters that define "segments" for this event (e.g., 'purchaserStatus' : 'frequent', or
 'gamerLevel' : 'intermediate')

 + Logging events to later be used for ads optimization around lifetime value.

 + Methods that control the way in which events are flushed out to the Facebook servers.

 Here are some important characteristics of the logging mechanism provided by `FBSDKAppEvents`:

 + Events are not sent immediately when logged.  They're cached and flushed out to the Facebook servers
 in a number of situations:
 - when an event count threshold is passed (currently 100 logged events).
 - when a time threshold is passed (currently 15 seconds).
 - when an app has gone to background and is then brought back to the foreground.

 + Events will be accumulated when the app is in a disconnected state, and sent when the connection is
 restored and one of the above 'flush' conditions are met.

 + The `FBSDKAppEvents` class is thread-safe in that events may be logged from any of the app's threads.

 + The developer can set the `flushBehavior` on `FBSDKAppEvents` to force the flushing of events to only
 occur on an explicit call to the `flush` method.

 + The developer can turn on console debug output for event logging and flushing to the server by using
 the `FBSDKLoggingBehaviorAppEvents` value in `[FBSettings setLoggingBehavior:]`.

 Some things to note when logging events:

 + There is a limit on the number of unique event names an app can use, on the order of 1000.
 + There is a limit to the number of unique parameter names in the provided parameters that can
 be used per event, on the order of 25.  This is not just for an individual call, but for all
 invocations for that eventName.
 + Event names and parameter names (the keys in the NSDictionary) must be between 2 and 40 characters, and
 must consist of alphanumeric characters, _, -, or spaces.
 + The length of each parameter value can be no more than on the order of 100 characters.

 */

NS_SWIFT_NAME(AppEvents)
@interface FBSDKAppEvents : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/*
 * Control over event batching/flushing
 */

/**

 The current event flushing behavior specifying when events are sent back to Facebook servers.
 */
@property (class, nonatomic, assign) FBSDKAppEventsFlushBehavior flushBehavior;

/**
 Set the 'override' App ID for App Event logging.



 In some cases, apps want to use one Facebook App ID for login and social presence and another
 for App Event logging.  (An example is if multiple apps from the same company share an app ID for login, but
 want distinct logging.)  By default, this value is `nil`, and defers to the `FBSDKAppEventsOverrideAppIDBundleKey`
 plist value.  If that's not set, it defaults to `[FBSDKSettings appID]`.

 This should be set before any other calls are made to `FBSDKAppEvents`.  Thus, you should set it in your application
 delegate's `application:didFinishLaunchingWithOptions:` delegate.
 */
@property (class, nonatomic, copy, nullable) NSString *loggingOverrideAppID;

/*
 The custom user ID to associate with all app events.

 The userID is persisted until it is cleared by passing nil.
 */
@property (class, nonatomic, copy, nullable) NSString *userID;

/*
 * Basic event logging
 */

/**

  Log an event with just an eventName.

 @param eventName   The name of the event to record.  Limitations on number of events and name length
 are given in the `FBSDKAppEvents` documentation.

 */
+ (void)logEvent:(FBSDKAppEventName)eventName;

/**

  Log an event with an eventName and a numeric value to be aggregated with other events of this name.

 @param eventName   The name of the event to record.  Limitations on number of events and name length
 are given in the `FBSDKAppEvents` documentation.  Common event names are provided in `FBAppEventName*` constants.

 @param valueToSum  Amount to be aggregated into all events of this eventName, and App Insights will report
 the cumulative and average value of this amount.
 */
+ (void)logEvent:(FBSDKAppEventName)eventName
      valueToSum:(double)valueToSum;


/**

  Log an event with an eventName and a set of key/value pairs in the parameters dictionary.
 Parameter limitations are described above.

 @param eventName   The name of the event to record.  Limitations on number of events and name construction
 are given in the `FBSDKAppEvents` documentation.  Common event names are provided in `FBAppEventName*` constants.

 @param parameters  Arbitrary parameter dictionary of characteristics. The keys to this dictionary must
 be NSString's, and the values are expected to be NSString or NSNumber.  Limitations on the number of
 parameters and name construction are given in the `FBSDKAppEvents` documentation.  Commonly used parameter names
 are provided in `FBSDKAppEventParameterName*` constants.
 */
+ (void)logEvent:(FBSDKAppEventName)eventName
      parameters:(NSDictionary<FBSDKAppEventParameterName, id> *)parameters;

/**

  Log an event with an eventName, a numeric value to be aggregated with other events of this name,
 and a set of key/value pairs in the parameters dictionary.

 @param eventName   The name of the event to record.  Limitations on number of events and name construction
 are given in the `FBSDKAppEvents` documentation.  Common event names are provided in `FBAppEventName*` constants.

 @param valueToSum  Amount to be aggregated into all events of this eventName, and App Insights will report
 the cumulative and average value of this amount.

 @param parameters  Arbitrary parameter dictionary of characteristics. The keys to this dictionary must
 be NSString's, and the values are expected to be NSString or NSNumber.  Limitations on the number of
 parameters and name construction are given in the `FBSDKAppEvents` documentation.  Commonly used parameter names
 are provided in `FBSDKAppEventParameterName*` constants.

 */
+ (void)logEvent:(FBSDKAppEventName)eventName
      valueToSum:(double)valueToSum
      parameters:(NSDictionary<FBSDKAppEventParameterName, id> *)parameters;


/**

  Log an event with an eventName, a numeric value to be aggregated with other events of this name,
 and a set of key/value pairs in the parameters dictionary.  Providing session lets the developer
 target a particular <FBSession>.  If nil is provided, then `[FBSession activeSession]` will be used.

 @param eventName   The name of the event to record.  Limitations on number of events and name construction
 are given in the `FBSDKAppEvents` documentation.  Common event names are provided in `FBAppEventName*` constants.

 @param valueToSum  Amount to be aggregated into all events of this eventName, and App Insights will report
 the cumulative and average value of this amount.  Note that this is an NSNumber, and a value of `nil` denotes
 that this event doesn't have a value associated with it for summation.

 @param parameters  Arbitrary parameter dictionary of characteristics. The keys to this dictionary must
 be NSString's, and the values are expected to be NSString or NSNumber.  Limitations on the number of
 parameters and name construction are given in the `FBSDKAppEvents` documentation.  Commonly used parameter names
 are provided in `FBSDKAppEventParameterName*` constants.

 @param accessToken  The optional access token to log the event as.
 */
+ (void)logEvent:(FBSDKAppEventName)eventName
      valueToSum:(nullable NSNumber *)valueToSum
      parameters:(NSDictionary<FBSDKAppEventParameterName, id> *)parameters
     accessToken:(nullable FBSDKAccessToken *)accessToken;

/*
 * Purchase logging
 */

/**

  Log a purchase of the specified amount, in the specified currency.

 @param purchaseAmount    Purchase amount to be logged, as expressed in the specified currency.  This value
 will be rounded to the thousandths place (e.g., 12.34567 becomes 12.346).

 @param currency          Currency, is denoted as, e.g. "USD", "EUR", "GBP".  See ISO-4217 for
 specific values.  One reference for these is <http://en.wikipedia.org/wiki/ISO_4217>.


              This event immediately triggers a flush of the `FBSDKAppEvents` event queue, unless the `flushBehavior` is set
 to `FBSDKAppEventsFlushBehaviorExplicitOnly`.

 */
+ (void)logPurchase:(double)purchaseAmount
           currency:(NSString *)currency;

/**

  Log a purchase of the specified amount, in the specified currency, also providing a set of
 additional characteristics describing the purchase.

 @param purchaseAmount  Purchase amount to be logged, as expressed in the specified currency.This value
 will be rounded to the thousandths place (e.g., 12.34567 becomes 12.346).

 @param currency        Currency, is denoted as, e.g. "USD", "EUR", "GBP".  See ISO-4217 for
 specific values.  One reference for these is <http://en.wikipedia.org/wiki/ISO_4217>.

 @param parameters      Arbitrary parameter dictionary of characteristics. The keys to this dictionary must
 be NSString's, and the values are expected to be NSString or NSNumber.  Limitations on the number of
 parameters and name construction are given in the `FBSDKAppEvents` documentation.  Commonly used parameter names
 are provided in `FBSDKAppEventParameterName*` constants.


              This event immediately triggers a flush of the `FBSDKAppEvents` event queue, unless the `flushBehavior` is set
 to `FBSDKAppEventsFlushBehaviorExplicitOnly`.

 */
+ (void)logPurchase:(double)purchaseAmount
           currency:(NSString *)currency
         parameters:(NSDictionary<NSString *, id> *)parameters;

/**

  Log a purchase of the specified amount, in the specified currency, also providing a set of
 additional characteristics describing the purchase, as well as an <FBSession> to log to.

 @param purchaseAmount  Purchase amount to be logged, as expressed in the specified currency.This value
 will be rounded to the thousandths place (e.g., 12.34567 becomes 12.346).

 @param currency        Currency, is denoted as, e.g. "USD", "EUR", "GBP".  See ISO-4217 for
 specific values.  One reference for these is <http://en.wikipedia.org/wiki/ISO_4217>.

 @param parameters      Arbitrary parameter dictionary of characteristics. The keys to this dictionary must
 be NSString's, and the values are expected to be NSString or NSNumber.  Limitations on the number of
 parameters and name construction are given in the `FBSDKAppEvents` documentation.  Commonly used parameter names
 are provided in `FBSDKAppEventParameterName*` constants.

 @param accessToken  The optional access token to log the event as.


            This event immediately triggers a flush of the `FBSDKAppEvents` event queue, unless the `flushBehavior` is set
 to `FBSDKAppEventsFlushBehaviorExplicitOnly`.

 */
+ (void)logPurchase:(double)purchaseAmount
           currency:(NSString *)currency
         parameters:(NSDictionary<NSString *, id> *)parameters
        accessToken:(nullable FBSDKAccessToken *)accessToken;


/*
 * Push Notifications Logging
 */

/**
  Log an app event that tracks that the application was open via Push Notification.

 @param payload Notification payload received via `UIApplicationDelegate`.
 */
+ (void)logPushNotificationOpen:(NSDictionary *)payload;

/**
  Log an app event that tracks that a custom action was taken from a push notification.

 @param payload Notification payload received via `UIApplicationDelegate`.
 @param action  Name of the action that was taken.
 */
+ (void)logPushNotificationOpen:(NSDictionary *)payload action:(NSString *)action;

/**
  Uploads product catalog product item as an app event
  @param itemID            Unique ID for the item. Can be a variant for a product.
                           Max size is 100.
  @param availability      If item is in stock. Accepted values are:
                              in stock - Item ships immediately
                              out of stock - No plan to restock
                              preorder - Available in future
                              available for order - Ships in 1-2 weeks
                              discontinued - Discontinued
  @param condition         Product condition: new, refurbished or used.
  @param description       Short text describing product. Max size is 5000.
  @param imageLink         Link to item image used in ad.
  @param link              Link to merchant's site where someone can buy the item.
  @param title             Title of item.
  @param priceAmount       Amount of purchase, in the currency specified by the 'currency'
                           parameter. This value will be rounded to the thousandths place
                           (e.g., 12.34567 becomes 12.346).
  @param currency          Currency used to specify the amount.
                           E.g. "USD", "EUR", "GBP".  See ISO-4217 for specific values. One reference for these is <http://en.wikipedia.org/wiki/ISO_4217>
  @param gtin              Global Trade Item Number including UPC, EAN, JAN and ISBN
  @param mpn               Unique manufacture ID for product
  @param brand             Name of the brand
                           Note: Either gtin, mpn or brand is required.
  @param parameters        Optional fields for deep link specification.
 */
+ (void)logProductItem:(NSString *)itemID
          availability:(FBSDKProductAvailability)availability
             condition:(FBSDKProductCondition)condition
           description:(NSString *)description
             imageLink:(NSString *)imageLink
                  link:(NSString *)link
                 title:(NSString *)title
           priceAmount:(double)priceAmount
              currency:(NSString *)currency
                  gtin:(nullable NSString *)gtin
                   mpn:(nullable NSString *)mpn
                 brand:(nullable NSString *)brand
            parameters:(nullable NSDictionary<NSString *, id> *)parameters;

/**

  Notifies the events system that the app has launched and, when appropriate, logs an "activated app" event.
 This function is called automatically from FBSDKApplicationDelegate applicationDidBecomeActive, unless
 one overrides 'FacebookAutoLogAppEventsEnabled' key to false in the project info plist file.
 In case 'FacebookAutoLogAppEventsEnabled' is set to false, then it should typically be placed in the
 app delegates' `applicationDidBecomeActive:` method.

 This method also takes care of logging the event indicating the first time this app has been launched, which, among other things, is used to
 track user acquisition and app install ads conversions.



 `activateApp` will not log an event on every app launch, since launches happen every time the app is backgrounded and then foregrounded.
 "activated app" events will be logged when the app has not been active for more than 60 seconds.  This method also causes a "deactivated app"
 event to be logged when sessions are "completed", and these events are logged with the session length, with an indication of how much
 time has elapsed between sessions, and with the number of background/foreground interruptions that session had.  This data
 is all visible in your app's App Events Insights.
 */
+ (void)activateApp;

/*
 * Push Notifications Registration and Uninstall Tracking
 */

/**
  Sets and sends device token to register the current application for push notifications.



 Sets and sends a device token from `NSData` representation that you get from `UIApplicationDelegate.-application:didRegisterForRemoteNotificationsWithDeviceToken:`.

 @param deviceToken Device token data.
 */
+ (void)setPushNotificationsDeviceToken:(NSData *)deviceToken;

/**
 Sets and sends device token string to register the current application for push notifications.



 Sets and sends a device token string

 @param deviceTokenString Device token string.
 */
+ (void)setPushNotificationsDeviceTokenString:(NSString *)deviceTokenString
NS_SWIFT_NAME(setPushNotificationsDeviceToken(_:));

/**
  Explicitly kick off flushing of events to Facebook.  This is an asynchronous method, but it does initiate an immediate
 kick off.  Server failures will be reported through the NotificationCenter with notification ID `FBSDKAppEventsLoggingResultNotification`.
 */
+ (void)flush;

/**
  Creates a request representing the Graph API call to retrieve a Custom Audience "third party ID" for the app's Facebook user.
 Callers will send this ID back to their own servers, collect up a set to create a Facebook Custom Audience with,
 and then use the resultant Custom Audience to target ads.

 The JSON in the request's response will include an "custom_audience_third_party_id" key/value pair, with the value being the ID retrieved.
 This ID is an encrypted encoding of the Facebook user's ID and the invoking Facebook app ID.
 Multiple calls with the same user will return different IDs, thus these IDs cannot be used to correlate behavior
 across devices or applications, and are only meaningful when sent back to Facebook for creating Custom Audiences.

 The ID retrieved represents the Facebook user identified in the following way: if the specified access token is valid,
 the ID will represent the user associated with that token; otherwise the ID will represent the user logged into the
 native Facebook app on the device.  If there is no native Facebook app, no one is logged into it, or the user has opted out
 at the iOS level from ad tracking, then a `nil` ID will be returned.

 This method returns `nil` if either the user has opted-out (via iOS) from Ad Tracking, the app itself has limited event usage
 via the `[FBSDKSettings limitEventAndDataUsage]` flag, or a specific Facebook user cannot be identified.

 @param accessToken The access token to use to establish the user's identity for users logged into Facebook through this app.
 If `nil`, then the `[FBSDKAccessToken currentAccessToken]` is used.
 */
+ (nullable FBSDKGraphRequest *)requestForCustomAudienceThirdPartyIDWithAccessToken:(nullable FBSDKAccessToken *)accessToken;

/*
 Clears the custom user ID to associate with all app events.
 */
+ (void)clearUserID;

/*
  Sets custom user data to associate with all app events. All user data are hashed
  and used to match Facebook user from this instance of an application.

  The user data will be persisted between application instances.

 @param email user's email
 @param firstName user's first name
 @param lastName user's last name
 @param phone user's phone
 @param dateOfBirth user's date of birth
 @param gender user's gender
 @param city user's city
 @param state user's state
 @param zip user's zip
 @param country user's country
 */
+ (void)setUserEmail:(nullable NSString *)email
           firstName:(nullable NSString *)firstName
            lastName:(nullable NSString *)lastName
               phone:(nullable NSString *)phone
         dateOfBirth:(nullable NSString *)dateOfBirth
              gender:(nullable NSString *)gender
                city:(nullable NSString *)city
               state:(nullable NSString *)state
                 zip:(nullable NSString *)zip
             country:(nullable NSString *)country
NS_SWIFT_NAME(setUser(email:firstName:lastName:phone:dateOfBirth:gender:city:state:zip:country:));

/*
  Returns the set user data else nil
*/
+ (nullable NSString *)getUserData;

/*
  Clears the current user data
*/
+ (void)clearUserData;

/*
 Sets custom user data to associate with all app events. All user data are hashed
 and used to match Facebook user from this instance of an application.

 The user data will be persisted between application instances.

 @param data  data
 @param type  data type, e.g. FBSDKAppEventEmail, FBSDKAppEventPhone
 */
+ (void)setUserData:(nullable NSString *)data
            forType:(FBSDKAppEventUserDataType)type;

/*
 Clears the current user data of certain type
 */
+ (void)clearUserDataForType:(FBSDKAppEventUserDataType)type;

/*
  Sends a request to update the properties for the current user, set by `setUserID:`

 You must call `FBSDKAppEvents setUserID:` before making this call.
 @param properties the custom user properties
 @param handler the optional completion handler
 */
+ (void)updateUserProperties:(NSDictionary<NSString *, id> *)properties handler:(nullable FBSDKGraphRequestBlock)handler;

#if !TARGET_OS_TV
/*
  Intended to be used as part of a hybrid webapp.
 If you call this method, the FB SDK will inject a new JavaScript object into your webview.
 If the FB Pixel is used within the webview, and references the app ID of this app,
 then it will detect the presence of this injected JavaScript object
 and pass Pixel events back to the FB SDK for logging using the AppEvents framework.

 @param webView The webview to augment with the additional JavaScript behaviour
 */
+ (void)augmentHybridWKWebView:(WKWebView *)webView;
#endif

/*
 * Unity helper functions
 */

/**

 Set if the Unity is already initialized

 @param isUnityInit   whether Unity is initialized.

 */
+ (void)setIsUnityInit:(BOOL)isUnityInit;

/*
 Send event binding to Unity
 */
+ (void)sendEventBindingsToUnity;

@end

NS_ASSUME_NONNULL_END
