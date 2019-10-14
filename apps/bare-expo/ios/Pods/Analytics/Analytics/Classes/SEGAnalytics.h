#import <Foundation/Foundation.h>
#import "SEGIntegrationFactory.h"
#import "SEGCrypto.h"
#import "SEGAnalyticsConfiguration.h"
#import "SEGSerializableValue.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * This object provides an API for recording analytics.
 */
@class SEGAnalyticsConfiguration;


@interface SEGAnalytics : NSObject

/**
 * Used by the analytics client to configure various options.
 */
@property (nonatomic, strong, readonly) SEGAnalyticsConfiguration *configuration;

/**
 * Setup this analytics client instance.
 *
 * @param configuration The configuration used to setup the client.
 */
- (instancetype)initWithConfiguration:(SEGAnalyticsConfiguration *)configuration;

/**
 * Setup the analytics client.
 *
 * @param configuration The configuration used to setup the client.
 */
+ (void)setupWithConfiguration:(SEGAnalyticsConfiguration *)configuration;

/**
 * Enabled/disables debug logging to trace your data going through the SDK.
 *
 * @param showDebugLogs `YES` to enable logging, `NO` otherwise. `NO` by default.
 */
+ (void)debug:(BOOL)showDebugLogs;

/**
 * Returns the shared analytics client.
 *
 * @see -setupWithConfiguration:
 */
+ (instancetype _Nullable)sharedAnalytics;

/*!
 @method

 @abstract
 Associate a user with their unique ID and record traits about them.

 @param userId        A database ID (or email address) for this user. If you don't have a userId
 but want to record traits, you should pass nil. For more information on how we
 generate the UUID and Apple's policies on IDs, see https://segment.io/libraries/ios#ids

 @param traits        A dictionary of traits you know about the user. Things like: email, name, plan, etc.

 @param options       A dictionary of options, such as the `@"anonymousId"` key. If no anonymous ID is specified one will be generated for you.

 @discussion
 When you learn more about who your user is, you can record that information with identify.

 */
- (void)identify:(NSString *_Nullable)userId traits:(SERIALIZABLE_DICT _Nullable)traits options:(SERIALIZABLE_DICT _Nullable)options;
- (void)identify:(NSString *_Nullable)userId traits:(SERIALIZABLE_DICT _Nullable)traits;
- (void)identify:(NSString *_Nullable)userId;


/*!
 @method

 @abstract
 Record the actions your users perform.

 @param event         The name of the event you're tracking. We recommend using human-readable names
 like `Played a Song` or `Updated Status`.

 @param properties    A dictionary of properties for the event. If the event was 'Added to Shopping Cart', it might
 have properties like price, productType, etc.

 @discussion
 When a user performs an action in your app, you'll want to track that action for later analysis. Use the event name to say what the user did, and properties to specify any interesting details of the action.

 */
- (void)track:(NSString *)event properties:(SERIALIZABLE_DICT _Nullable)properties options:(SERIALIZABLE_DICT _Nullable)options;
- (void)track:(NSString *)event properties:(SERIALIZABLE_DICT _Nullable)properties;
- (void)track:(NSString *)event;

/*!
 @method

 @abstract
 Record the screens or views your users see.

 @param screenTitle   The title of the screen being viewed. We recommend using human-readable names
 like 'Photo Feed' or 'Completed Purchase Screen'.

 @param properties    A dictionary of properties for the screen view event. If the event was 'Added to Shopping Cart',
 it might have properties like price, productType, etc.

 @discussion
 When a user views a screen in your app, you'll want to record that here. For some tools like Google Analytics and Flurry, screen views are treated specially, and are different from "events" kind of like "page views" on the web. For services that don't treat "screen views" specially, we map "screen" straight to "track" with the same parameters. For example, Mixpanel doesn't treat "screen views" any differently. So a call to "screen" will be tracked as a normal event in Mixpanel, but get sent to Google Analytics and Flurry as a "screen".

 */
- (void)screen:(NSString *)screenTitle properties:(SERIALIZABLE_DICT _Nullable)properties options:(SERIALIZABLE_DICT _Nullable)options;
- (void)screen:(NSString *)screenTitle properties:(SERIALIZABLE_DICT _Nullable)properties;
- (void)screen:(NSString *)screenTitle;

/*!
 @method

 @abstract
 Associate a user with a group, organization, company, project, or w/e *you* call them.

 @param groupId       A database ID for this group.
 @param traits        A dictionary of traits you know about the group. Things like: name, employees, etc.

 @discussion
 When you learn more about who the group is, you can record that information with group.

 */
- (void)group:(NSString *)groupId traits:(SERIALIZABLE_DICT _Nullable)traits options:(SERIALIZABLE_DICT _Nullable)options;
- (void)group:(NSString *)groupId traits:(SERIALIZABLE_DICT _Nullable)traits;
- (void)group:(NSString *)groupId;

/*!
 @method

 @abstract
 Merge two user identities, effectively connecting two sets of user data as one.
 This may not be supported by all integrations.

 @param newId         The new ID you want to alias the existing ID to. The existing ID will be either the
 previousId if you have called identify, or the anonymous ID.

 @discussion
 When you learn more about who the group is, you can record that information with group.

 */
- (void)alias:(NSString *)newId options:(SERIALIZABLE_DICT _Nullable)options;
- (void)alias:(NSString *)newId;

// todo: docs
- (void)receivedRemoteNotification:(NSDictionary *)userInfo;
- (void)failedToRegisterForRemoteNotificationsWithError:(NSError *)error;
- (void)registeredForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo;
- (void)continueUserActivity:(NSUserActivity *)activity;
- (void)openURL:(NSURL *)url options:(NSDictionary *)options;

/*!
 @method

 @abstract
 Trigger an upload of all queued events.

 @discussion
 This is useful when you want to force all messages queued on the device to be uploaded. Please note that not all integrations
 respond to this method.
 */
- (void)flush;

/*!
 @method

 @abstract
 Reset any user state that is cached on the device.

 @discussion
 This is useful when a user logs out and you want to clear the identity. It will clear any
 traits or userId's cached on the device.
 */
- (void)reset;

/*!
 @method

 @abstract
 Enable the sending of analytics data. Enabled by default.

 @discussion
 Occasionally used in conjunction with disable user opt-out handling.
 */
- (void)enable;


/*!
 @method

 @abstract
 Completely disable the sending of any analytics data.

 @discussion
 If have a way for users to actively or passively (sometimes based on location) opt-out of
 analytics data collection, you can use this method to turn off all data collection.
 */
- (void)disable;


/**
 * Version of the library.
 */
+ (NSString *)version;

/**
 * Returns a dictionary of integrations that are bundled. This is an internal Segment API, and may be removed at any time
 * without notice.
 */
- (NSDictionary *)bundledIntegrations;

/** Returns the anonymous ID of the current user. */
- (NSString *)getAnonymousId;

/** Returns the configuration used to create the analytics client. */
- (SEGAnalyticsConfiguration *)configuration;


@end

NS_ASSUME_NONNULL_END
