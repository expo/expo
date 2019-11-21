/*
 *    HelpshiftCore.h
 *    SDK Version 7.6.2
 *
 *    Get the documentation at http://www.helpshift.com/docs
 *
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
@protocol HsApiProvider;

typedef enum HsAddFAQsToDeviceSearch
{
    HsAddFaqsToDeviceSearchOnInstall __attribute__((deprecated)) = 0,
    HsAddFaqsToDeviceSearchAfterViewingFAQs,
    HsAddFaqsToDeviceSearchNever
} HsAddFAQsToDeviceSearch;

typedef enum HsOperator
{
    HsOperatorAnd = 0,
    HsOperatorOr,
    HsOperatorNot
} HsOperator;

typedef enum HsEnableContactUs
{
    HsEnableContactUsAlways = 0,
    HsEnableContactUsAfterViewingFAQs,
    HsEnableContactUsAfterMarkingAnswerUnhelpful,
    HsEnableContactUsNever
} HsEnableContactUs;

@interface HelpshiftFAQFilter : NSObject
/*
 * For more information about these configs, please visit the developer docs (https://developers.helpshift.com/ios/support-tools/#faq-filtering )
 */
@property (readonly, nonatomic) HsOperator filterOperator;
@property (readonly, nonatomic) NSArray *tags;

/*
 * Initialize HelpshiftFAQFilter object with custom values.
 */
- (id) initWithFilterOperator:(HsOperator)filterOperator andTags:(NSArray *)tags;

/*
 * Use the initWithFilterOperatorAndTags api to initialize.
 */
- (id) init NS_UNAVAILABLE;
@end

@interface HelpshiftSupportMetaData : NSObject
/*
 * For more information about these configs, please visit the developer docs (https://developers.helpshift.com/ios/tracking/#metadata )
 */
@property (readonly, nonatomic) NSDictionary *metaData;
@property (readonly, nonatomic) NSArray *issueTags;

/*
 * Initialize SupportMetaData object with metaData.
 */
- (id) initWithMetaData:(NSDictionary *)metaData;

/*
 * Initialize SupportMetaData object with metaData and issue tags.
 */
- (id) initWithMetaData:(NSDictionary *)metaData andTags:(NSArray *)tags;

/*
 * Use the initWithMetaData or initWithMetaDataAndTags api to initialize.
 */
- (id) init NS_UNAVAILABLE;
@end

@interface HelpshiftInstallConfig : NSObject
- (id) init NS_UNAVAILABLE;
@end

@interface HelpshiftInstallConfigBuilder : NSObject
@property (nonatomic, assign) BOOL enableDefaultFallbackLanguage;
@property (nonatomic, assign) BOOL disableEntryExitAnimations;
@property (nonatomic, assign) BOOL enableInboxPolling;
@property (nonatomic, assign) BOOL enableInAppNotifications;
@property (nonatomic, assign) BOOL enableLogging;
@property (nonatomic, assign) HsAddFAQsToDeviceSearch addFaqsToDeviceSearch;
@property (nonatomic, assign) BOOL disableAutomaticPushHandling __deprecated_msg("This config is now deprecated. In following releases, the SDK will stop automatic push handling via swizzling. Please ensure that you are following the guide here: https://developers.helpshift.com/ios/notifications/#configure-helpshift-sdk");
@property (nonatomic, strong) NSDictionary *extraConfig;

- (HelpshiftInstallConfig *) build;
@end

@interface HelpshiftAPIConfig : NSObject
- (id) init NS_UNAVAILABLE;
@end

@interface HelpshiftAPIConfigBuilder : NSObject
@property (nonatomic, assign) BOOL presentFullScreenOniPad;
@property (nonatomic, assign) BOOL enableFullPrivacy;
@property (nonatomic, assign) BOOL showConversationInfoScreen;
@property (nonatomic, assign) HsEnableContactUs enableContactUs;
@property (strong, nonatomic) NSArray *customContactUsFlows;
@property (strong, nonatomic) HelpshiftFAQFilter *withTagsMatching;
@property (strong, nonatomic) HelpshiftSupportMetaData *customMetaData;
@property (strong, nonatomic) NSDictionary *customIssueFields;
@property (strong, nonatomic) NSDictionary *extraConfig;
@property (strong, nonatomic) NSString *conversationPrefillText;
@property (nonatomic, assign) BOOL gotoConversationAfterContactUs __deprecated_msg("This config is applicable only for form based issue filing experience which is deprecated from SDK version 7.0.0.");
@property (nonatomic, assign) BOOL requireEmail __deprecated_msg("This config is applicable only for form based issue filing experience which is deprecated from SDK version 7.0.0.");
@property (nonatomic, assign) BOOL hideNameAndEmail __deprecated_msg("This config is applicable only for form based issue filing experience which is deprecated from SDK version 7.0.0.");
@property (nonatomic, assign) BOOL showSearchOnNewConversation __deprecated_msg("This config is applicable only for form based issue filing experience which is deprecated from SDK version 7.0.0.");
@property (nonatomic, assign) BOOL showConversationResolutionQuestion __deprecated_msg("This config is now deprecated. Please turn On/Off this config from app settings (In App SDK configuration page on Admin dashboard)");
@property (nonatomic, assign) BOOL enableTypingIndicator __deprecated_msg("This config is now deprecated. Please turn On/Off this config from app settings (In App SDK configuration page on Admin dashboard)");

- (HelpshiftAPIConfig *) build;
@end

@interface HelpshiftUser : NSObject
- (id) init NS_UNAVAILABLE;
@property (readonly, copy, nonatomic) NSString *identifier;
@property (readonly, copy, nonatomic) NSString *email;
@property (readonly, copy, nonatomic) NSString *name;
@property (readonly, copy, nonatomic) NSString *authToken;
@end

@interface HelpshiftUserBuilder : NSObject
@property (readonly, strong, nonatomic) NSString *identifier;
@property (readonly, strong, nonatomic) NSString *email;
@property (strong, nonatomic) NSString *name;
@property (strong, nonatomic) NSString *authToken;

- (id) init NS_UNAVAILABLE;
- (id) initWithIdentifier:(NSString *)identifier andEmail:(NSString *)email;
- (HelpshiftUser *) build;
@end

/**
 * Helpshift Core API provider
 */

@interface HelpshiftCore : NSObject
/**
 * Enable the testing mode for the SDK. This will give additional debug information to help you with SDK integration.
 * DO NOT enable this in production build of your application.
 */
+ (void) enableTestingMode;

/**
 *  Initialize the HelpshiftCore class with an instance of the Helpshift service which you want to use.
 *  @param apiProvider An implementation of the HsApiProvider protocol. Current implementors of this service are the HelpshiftCampaigns, HelpshiftSupport and HelpshiftAll classes.
 */
+ (void) initializeWithProvider:(id <HsApiProvider>)apiProvider;

/** Initialize helpshift support
 *
 * When initializing Helpshift you must pass these three tokens. You initialize Helpshift by adding the following lines in the implementation file for your app delegate, ideally at the top of application:didFinishLaunchingWithOptions. This method can throw the InstallException asynchronously if the install keys are not in the correct format.
 *  @param apiKey This is your developer API Key
 *  @param domainName This is your domain name without any http:// or forward slashes
 *  @param appID This is the unique ID assigned to your app
 *  @available Available in SDK version 5.0.0 or later
 */
+ (void) installForApiKey:(NSString *)apiKey domainName:(NSString *)domainName appID:(NSString *)appID;

/** Initialize helpshift support
 * When initializing Helpshift you must pass these three tokens. You initialize Helpshift by adding the following lines in the implementation file for your app delegate, ideally at the top of application:didFinishLaunchingWithOptions. This method can throw the InstallException asynchronously if the install keys are not in the correct format.
 * @param apiKey This is your developer API Key
 * @param domainName This is your domain name without any http:// or forward slashes
 * @param appID This is the unique ID assigned to your app
 * @param optionsDictionary This is the dictionary which contains additional configuration options for the HelpshiftSDK.
 * @available Available in SDK version 5.0.0 or later
 */

+ (void) installForApiKey:(NSString *)apiKey domainName:(NSString *)domainName appID:(NSString *)appID withOptions:(NSDictionary *)optionsDictionary __deprecated;

/** Initialize helpshift support
 *
 * When initializing Helpshift you must pass these three tokens. You initialize Helpshift by adding the following lines in the implementation file for your app delegate, ideally at the top of application:didFinishLaunchingWithOptions
 * @param apiKey This is your developer API Key
 * @param domainName This is your domain name without any http:// or forward slashes
 * @param appID This is the unique ID assigned to your app
 * @param configObject This is the install config object which contains additional configuration options for the HelpshiftSDK.
 * @available Available in SDK version 5.7.0 or later
 */

+ (void) installForApiKey:(NSString *)apiKey domainName:(NSString *)domainName appID:(NSString *)appID withConfig:(HelpshiftInstallConfig *)configObject;

/** Login a user with a given identifier
 * The identifier uniquely identifies the user. Name and email are optional.
 * @param identifier The unique identifier of the user.
 * @param name The name of the user.
 * @param email The email of the user.
 * @deprecated Deprecated in SDK version 7.0.0.
 */
+ (void) loginWithIdentifier:(NSString *)identifier withName:(NSString *)name andEmail:(NSString *) email __deprecated_msg("Use login: instead");

/** Login a user with a given identifier or email.
 * The identifier or email uniquely identify the user. Name and authToken are optional.
 * @param user The HelpshiftUser object which contains all the information about a user such as identifier, name, email, authToken.
 * @available Available in SDK version 7.0.0 or later
 */
+ (void) login:(HelpshiftUser *)user;

/** Logout the currently logged in user
 * After logout, Helpshift falls back to the default device login.
 * @available Available in SDK version 5.0.0 or later
 */
+ (void) logout;

/**
 * Delete the anonymous user data
 * @available Available in SDK version 7.0.0 or later
 */
+ (void) clearAnonymousUser;

/** Set the name and email of the application user.
 *   @param name The name of the user.
 *   @param email The email address of the user.
 *
 *   NOTE: This API will not update the name & email provided from login API.
 *   Data from this API will be used to pre-fill name and email fields in the conversation form and also updates name and email property in campaigns.
 *   @available Available in SDK version 5.0.0 or later
 *   @deprecated Deprecated in SDK version 7.0.0.
 */

+ (void) setName:(NSString *)name andEmail:(NSString *) email __deprecated_msg("Use login: instead");

/** Register the deviceToken to enable push notifications
 * To enable push notifications in the Helpshift iOS SDK, set the Push Notifications’ deviceToken using this method inside your application:didRegisterForRemoteNotificationsWithDeviceToken application delegate.
 *  @param deviceToken The deviceToken received from the push notification servers.
 *  @available Available in SDK version 5.0.0 or later
 */
+ (void) registerDeviceToken:(NSData *)deviceToken;

/**
 *  Pass along the userInfo dictionary (received with a UNNotification) for the Helpshift SDK to handle
 *  @param userInfo   dictionary contained in the UNNotification object received in App delegate.
 *  @param viewController The viewController on which you want the Helpshift SDK stack to be shown
 *  @param isAppLaunch    A boolean indicating whether the app was lanuched from a killed state. This parameter should ideally only be true in case when called from app's didFinishLaunchingWithOptions delegate.
 *  @return BOOL value indicating whether Helpshift handled this notification.
 *  @available Available in SDK version 6.4.0 or later
 */
+ (BOOL) handleNotificationWithUserInfoDictionary:(NSDictionary *)userInfo isAppLaunch:(BOOL)isAppLaunch withController:(UIViewController *)viewController;

/**
 *  Pass along the notification response information for Helpshift SDK to handle
 *  @param actionIdentifier identifier of the action which was executed in the notification
 *  @param userInfo userInfo Dictionary received (contained in the UNNotificationResponse object)
 *  @param completionHandler completion handler
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 *  @available Available in SDK version 6.4.0 or later
 */
+ (BOOL) handleNotificationResponseWithActionIdentifier:(NSString *)actionIdentifier userInfo:(NSDictionary *)userInfo completionHandler:(void (^)(void))completionHandler;

/**
 *  If an app is woken up in the background in response to a background session being completed, call this API from the
 *  Application's delegate method. Helpshift SDK extensively uses background NSURLSessions for data syncing.
 *  @param identifier        identifier of the background session
 *  @param completionHandler completion handler
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 */
+ (BOOL) handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler;

/** Change the SDK language. By default, the device's prefered language is used.
 * The call will fail in the following cases :
 * 1. If a Helpshift session is already active at the time of invocation
 * 2. Language code is incorrect
 * 3. Corresponding localization file is not found
 * @param languageCode the string representing the language code. For example, use 'fr' for French.
 * @available Available in SDK version 6.1.0 or later
 */

+ (void) setLanguage:(NSString *)languageCode;

#pragma mark - Deprecated APIs

/** Change the SDK language. By default, the device's prefered language is used.
 *  If a Helpshift session is already active at the time of invocation, this call will fail and will return false.
 *
 * @param languageCode the string representing the language code. For example, use 'fr' for French.
 *
 * @return BOOL indicating wether the specified language was applied. In case the language code is incorrect or
 * the corresponding localization file was not found, bool value of false is returned and the default language is used.
 *
 * @available Available in SDK version 5.5.0 or later
 * @deprecated Deprecated in SDK version 6.1.0.
 */
+ (BOOL) setSDKLanguage:(NSString *) languageCode __deprecated_msg("Use setLanguage: instead");

/**
 *  Pass along a notification to the Helpshift SDK to handle
 *
 *  @param notification   Notification dictionary
 *  @param viewController The viewController on which you want the Helpshift SDK stack to be shown
 *
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 */
+ (BOOL) handleRemoteNotification:(NSDictionary *)notification withController:(UIViewController *) viewController __deprecated_msg("Use handleNotificationWithUserInfoDictionary:isAppLaunch:withController: instead");

/**
 *  Pass along a notification to the Helpshift SDK to handle
 *
 *  @param notification   Notification dictionary
 *  @param isAppLaunch    A boolean indicating whether the app was lanuched from a killed state. This parameter should ideally only be true in case when called from app's didFinishLaunchingWithOptions delegate.
 *  @param viewController The viewController on which you want the Helpshift SDK stack to be shown
 *
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 */
+ (BOOL) handleRemoteNotification:(NSDictionary *)notification isAppLaunch:(BOOL)isAppLaunch withController:(UIViewController *) viewController __deprecated_msg("Use handleNotificationWithUserInfoDictionary:isAppLaunch:withController: instead");

/**
 *  Pass along a local notification to the Helpshift SDK
 *
 *  @param notification   notification object received in the Application's delegate method
 *  @param viewController The viewController on which you want the Helpshift SDK stack to be shown
 *
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 */
+ (BOOL) handleLocalNotification:(UILocalNotification *)notification withController:(UIViewController *) viewController __deprecated_msg("Use handleNotificationWithUserInfoDictionary:isAppLaunch:withController: instead");

/**
 *  Pass along an interactive local notification to the Helpshift SDK
 *
 *  @param notification      notification object received in the Application's delegate
 *  @param actionIdentifier  identifier of the action which was executed in the notification
 *  @param completionHandler completion handler
 *
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 */
+ (BOOL) handleInteractiveLocalNotification:(UILocalNotification *)notification forAction:(NSString *)actionIdentifier completionHandler:(void (^)(void)) completionHandler __deprecated_msg("Use handleInteractiveLocalNotificationWithUserInfoDictionary:forAction:completionHandler: instead");

/**
 *  Pass along an interactive notification to the Helpshift SDK
 *
 *  @param notification      notification object received in the Application's delegate
 *  @param actionIdentifier  identifier of the action which was executed in the notification
 *  @param completionHandler completion handler
 *
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 */
+ (BOOL) handleInteractiveRemoteNotification:(NSDictionary *)notification forAction:(NSString *)actionIdentifier completionHandler:(void (^)(void)) completionHandler __deprecated_msg("Use handleNotificationResponseWithActionIdentifier:userInfo:completionHandler: instead");

/**
 *  Pass along an interactive local notification's userInfo to the Helpshift SDK
 *
 *  @param userInfo      userInfo  received in the notification
 *  @param actionIdentifier  identifier of the action which was executed in the notification
 *  @param completionHandler completion handler
 *
 *  @return BOOL value indicating whether Helpshift handled this push notification.
 */
+ (BOOL) handleInteractiveLocalNotificationWithUserInfoDictionary:(NSDictionary *)userInfo forAction:(NSString *)actionIdentifier completionHandler:(void (^)(void)) completionHandler __deprecated_msg("Use handleNotificationResponseWithActionIdentifier:userInfo:completionHandler: instead");


@end

@protocol HsApiProvider <NSObject>
- (void) _installForApiKey:(NSString *)apiKey domainName:(NSString *)domainName appID:(NSString *)appID;
- (void) _installForApiKey:(NSString *)apiKey domainName:(NSString *)domainName appID:(NSString *)appID withConfig:(HelpshiftInstallConfig *)configObject;
- (BOOL) _login:(HelpshiftUser *)user;
- (BOOL) _logout;
- (BOOL) _clearAnonymousUser;
- (void) _setName:(NSString *)name andEmail:(NSString *)email;
- (void) _registerDeviceToken:(NSData *)deviceToken;
- (BOOL) _handleRemoteNotification:(NSDictionary *)notification withController:(UIViewController *)viewController;
- (BOOL) _handleRemoteNotification:(NSDictionary *)notification isAppLaunch:(BOOL)isAppLaunch withController:(UIViewController *)viewController;
- (BOOL) _handleLocalNotificationWithUserInfoDictionary:(NSDictionary *)userInfo withController:(UIViewController *)viewController;
- (void) _handleInteractiveRemoteNotification:(NSDictionary *)notification forAction:(NSString *)actionIdentifier completionHandler:(void (^)(void))completionHandler;
- (void) _handleInteractiveLocalNotification:(NSDictionary *)notification forAction:(NSString *)actionIdentifier completionHandler:(void (^)(void))completionHandler;
- (void) _handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler;
- (BOOL) _setSDKLanguage:(NSString *)langCode;

@end

