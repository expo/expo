//
//  Crashlytics.h
//  Crashlytics
//
//  Copyright (c) 2015 Crashlytics, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "CLSAttributes.h"
#import "CLSLogging.h"
#import "CLSReport.h"
#import "CLSStackFrame.h"
#import "Answers.h"

NS_ASSUME_NONNULL_BEGIN

@protocol CrashlyticsDelegate;

/**
 * Crashlytics. Handles configuration and initialization of Crashlytics.
 *
 * Note: The Crashlytics class cannot be subclassed. If this is causing you pain for
 * testing, we suggest using either a wrapper class or a protocol extension.
 */
@interface Crashlytics : NSObject

@property (nonatomic, readonly, copy) NSString *APIKey;
@property (nonatomic, readonly, copy) NSString *version;
@property (nonatomic, assign)         BOOL      debugMode;

/**
 *
 * The delegate can be used to influence decisions on reporting and behavior, as well as reacting
 * to previous crashes.
 *
 * Make certain that the delegate is setup before starting Crashlytics with startWithAPIKey:... or
 * via +[Fabric with:...]. Failure to do will result in missing any delegate callbacks that occur
 * synchronously during start.
 *
 **/
@property (nonatomic, assign, nullable) id <CrashlyticsDelegate> delegate;

/**
 *  The recommended way to install Crashlytics into your application is to place a call to +startWithAPIKey: 
 *  in your -application:didFinishLaunchingWithOptions: or -applicationDidFinishLaunching:
 *  method.
 *
 *  Note: Starting with 3.0, the submission process has been significantly improved. The delay parameter
 *  is no longer required to throttle submissions on launch, performance will be great without it.
 *
 *  @param apiKey The Crashlytics API Key for this app
 *
 *  @return The singleton Crashlytics instance
 */
+ (Crashlytics *)startWithAPIKey:(NSString *)apiKey;
+ (Crashlytics *)startWithAPIKey:(NSString *)apiKey afterDelay:(NSTimeInterval)delay CLS_DEPRECATED("Crashlytics no longer needs or uses the delay parameter.  Please use +startWithAPIKey: instead.");

/**
 *  If you need the functionality provided by the CrashlyticsDelegate protocol, you can use
 *  these convenience methods to activate the framework and set the delegate in one call.
 *  
 *  @param apiKey   The Crashlytics API Key for this app
 *  @param delegate A delegate object which conforms to CrashlyticsDelegate.
 *
 *  @return The singleton Crashlytics instance
 */
+ (Crashlytics *)startWithAPIKey:(NSString *)apiKey delegate:(nullable id<CrashlyticsDelegate>)delegate;
+ (Crashlytics *)startWithAPIKey:(NSString *)apiKey delegate:(nullable id<CrashlyticsDelegate>)delegate afterDelay:(NSTimeInterval)delay CLS_DEPRECATED("Crashlytics no longer needs or uses the delay parameter.  Please use +startWithAPIKey:delegate: instead.");

/**
 *  Access the singleton Crashlytics instance.
 *
 *  @return The singleton Crashlytics instance
 */
+ (Crashlytics *)sharedInstance;

/**
 *  The easiest way to cause a crash - great for testing!
 */
- (void)crash;

/**
 *  The easiest way to cause a crash with an exception - great for testing.
 */
- (void)throwException;

/**
 *  Specify a user identifier which will be visible in the Crashlytics UI.
 *
 *  Many of our customers have requested the ability to tie crashes to specific end-users of their
 *  application in order to facilitate responses to support requests or permit the ability to reach
 *  out for more information. We allow you to specify up to three separate values for display within
 *  the Crashlytics UI - but please be mindful of your end-user's privacy.
 *
 *  We recommend specifying a user identifier - an arbitrary string that ties an end-user to a record
 *  in your system. This could be a database id, hash, or other value that is meaningless to a
 *  third-party observer but can be indexed and queried by you.
 *
 *  Optionally, you may also specify the end-user's name or username, as well as email address if you
 *  do not have a system that works well with obscured identifiers.
 *
 *  Pursuant to our EULA, this data is transferred securely throughout our system and we will not
 *  disseminate end-user data unless required to by law. That said, if you choose to provide end-user
 *  contact information, we strongly recommend that you disclose this in your application's privacy
 *  policy. Data privacy is of our utmost concern.
 *
 *  @param identifier An arbitrary user identifier string which ties an end-user to a record in your system.
 */
- (void)setUserIdentifier:(nullable NSString *)identifier;

/**
 *  Specify a user name which will be visible in the Crashlytics UI.
 *  Please be mindful of your end-user's privacy and see if setUserIdentifier: can fulfil your needs.
 *  @see setUserIdentifier:
 *
 *  @param name An end user's name.
 */
- (void)setUserName:(nullable NSString *)name;

/**
 *  Specify a user email which will be visible in the Crashlytics UI.
 *  Please be mindful of your end-user's privacy and see if setUserIdentifier: can fulfil your needs.
 *  
 *  @see setUserIdentifier:
 *
 *  @param email An end user's email address.
 */
- (void)setUserEmail:(nullable NSString *)email;

+ (void)setUserIdentifier:(nullable NSString *)identifier CLS_DEPRECATED("Please access this method via +sharedInstance");
+ (void)setUserName:(nullable NSString *)name CLS_DEPRECATED("Please access this method via +sharedInstance");
+ (void)setUserEmail:(nullable NSString *)email CLS_DEPRECATED("Please access this method via +sharedInstance");

/**
 *  Set a value for a for a key to be associated with your crash data which will be visible in the Crashlytics UI.
 *  When setting an object value, the object is converted to a string. This is typically done by calling 
 *  -[NSObject description].
 *
 *  @param value The object to be associated with the key
 *  @param key   The key with which to associate the value
 */
- (void)setObjectValue:(nullable id)value forKey:(NSString *)key;

/**
 *  Set an int value for a key to be associated with your crash data which will be visible in the Crashlytics UI.
 *
 *  @param value The integer value to be set
 *  @param key   The key with which to associate the value
 */
- (void)setIntValue:(int)value forKey:(NSString *)key;

/**
 *  Set an BOOL value for a key to be associated with your crash data which will be visible in the Crashlytics UI.
 *
 *  @param value The BOOL value to be set
 *  @param key   The key with which to associate the value
 */
- (void)setBoolValue:(BOOL)value forKey:(NSString *)key;

/**
 *  Set an float value for a key to be associated with your crash data which will be visible in the Crashlytics UI.
 *
 *  @param value The float value to be set
 *  @param key   The key with which to associate the value
 */
- (void)setFloatValue:(float)value forKey:(NSString *)key;

+ (void)setObjectValue:(nullable id)value forKey:(NSString *)key CLS_DEPRECATED("Please access this method via +sharedInstance");
+ (void)setIntValue:(int)value forKey:(NSString *)key CLS_DEPRECATED("Please access this method via +sharedInstance");
+ (void)setBoolValue:(BOOL)value forKey:(NSString *)key CLS_DEPRECATED("Please access this method via +sharedInstance");
+ (void)setFloatValue:(float)value forKey:(NSString *)key CLS_DEPRECATED("Please access this method via +sharedInstance");

/**
 *  This method can be used to record a single exception structure in a report. This is particularly useful
 *  when your code interacts with non-native languages like Lua, C#, or Javascript. This call can be
 *  expensive and should only be used shortly before process termination. This API is not intended be to used
 *  to log NSException objects. All safely-reportable NSExceptions are automatically captured by
 *  Crashlytics.
 *
 *  @param name       The name of the custom exception
 *  @param reason     The reason this exception occurred
 *  @param frameArray An array of CLSStackFrame objects
 */
- (void)recordCustomExceptionName:(NSString *)name reason:(nullable NSString *)reason frameArray:(CLS_GENERIC_NSARRAY(CLSStackFrame *) *)frameArray;

/**
 *
 * This allows you to record a non-fatal event, described by an NSError object. These events will be grouped and
 * displayed similarly to crashes. Keep in mind that this method can be expensive. Also, the total number of
 * NSErrors that can be recorded during your app's life-cycle is limited by a fixed-size circular buffer. If the
 * buffer is overrun, the oldest data is dropped. Errors are relayed to Crashlytics on a subsequent launch
 * of your application.
 *
 * You can also use the -recordError:withAdditionalUserInfo: to include additional context not represented
 * by the NSError instance itself.
 *
 **/
- (void)recordError:(NSError *)error;
- (void)recordError:(NSError *)error withAdditionalUserInfo:(nullable CLS_GENERIC_NSDICTIONARY(NSString *, id) *)userInfo;

- (void)logEvent:(NSString *)eventName CLS_DEPRECATED("Please refer to Answers +logCustomEventWithName:");
- (void)logEvent:(NSString *)eventName attributes:(nullable NSDictionary *) attributes CLS_DEPRECATED("Please refer to Answers +logCustomEventWithName:");
+ (void)logEvent:(NSString *)eventName CLS_DEPRECATED("Please refer to Answers +logCustomEventWithName:");
+ (void)logEvent:(NSString *)eventName attributes:(nullable NSDictionary *) attributes CLS_DEPRECATED("Please refer to Answers +logCustomEventWithName:");

@end

/**
 *
 * The CrashlyticsDelegate protocol provides a mechanism for your application to take
 * action on events that occur in the Crashlytics crash reporting system.  You can make
 * use of these calls by assigning an object to the Crashlytics' delegate property directly,
 * or through the convenience +startWithAPIKey:delegate: method.
 *
 */
@protocol CrashlyticsDelegate <NSObject>
@optional


- (void)crashlyticsDidDetectCrashDuringPreviousExecution:(Crashlytics *)crashlytics CLS_DEPRECATED("Please refer to -crashlyticsDidDetectReportForLastExecution:");
- (void)crashlytics:(Crashlytics *)crashlytics didDetectCrashDuringPreviousExecution:(id <CLSCrashReport>)crash CLS_DEPRECATED("Please refer to -crashlyticsDidDetectReportForLastExecution:");

/**
 *
 *  Called when a Crashlytics instance has determined that the last execution of the
 *  application resulted in a saved report.  This is called synchronously on Crashlytics
 *  initialization. Your delegate must invoke the completionHandler, but does not need to do so
 *  synchronously, or even on the main thread. Invoking completionHandler with NO will cause the
 *  detected report to be deleted and not submitted to Crashlytics. This is useful for
 *  implementing permission prompts, or other more-complex forms of logic around submitting crashes.
 *
 *  Instead of using this method, you should try to make use of -crashlyticsDidDetectReportForLastExecution: 
 *  if you can.
 *
 *  @warning Failure to invoke the completionHandler will prevent submissions from being reported. Watch out.
 *
 *  @warning Just implementing this delegate method will disable all forms of synchronous report submission. This can
 *           impact the reliability of reporting crashes very early in application launch.
 *
 *  @param report            The CLSReport object representing the last detected report
 *  @param completionHandler The completion handler to call when your logic has completed.
 *
 */
- (void)crashlyticsDidDetectReportForLastExecution:(CLSReport *)report completionHandler:(void (^)(BOOL submit))completionHandler;

/**
 *
 *  Called when a Crashlytics instance has determined that the last execution of the
 *  application resulted in a saved report. This method differs from
 *  -crashlyticsDidDetectReportForLastExecution:completionHandler: in three important ways:
 *
 *    - it is not called synchronously during initialization
 *    - it does not give you the ability to prevent the report from being submitted
 *    - the report object itself is immutable
 *
 *  Thanks to these limitations, making use of this method does not impact reporting 
 *  reliabilty in any way.
 *
 *  @param report The read-only CLSReport object representing the last detected report
 *
 */

- (void)crashlyticsDidDetectReportForLastExecution:(CLSReport *)report;

/**
 *  If your app is running on an OS that supports it (OS X 10.9+, iOS 7.0+), Crashlytics will submit
 *  most reports using out-of-process background networking operations. This results in a significant
 *  improvement in reliability of reporting, as well as power and performance wins for your users.
 *  If you don't want this functionality, you can disable by returning NO from this method.
 *
 *  @warning Background submission is not supported for extensions on iOS or OS X.
 *
 *  @param crashlytics The Crashlytics singleton instance
 *
 *  @return Return NO if you don't want out-of-process background network operations.
 *
 */
- (BOOL)crashlyticsCanUseBackgroundSessions:(Crashlytics *)crashlytics;

@end

/**
 *  `CrashlyticsKit` can be used as a parameter to `[Fabric with:@[CrashlyticsKit]];` in Objective-C. In Swift, use Crashlytics.sharedInstance()
 */
#define CrashlyticsKit [Crashlytics sharedInstance]

NS_ASSUME_NONNULL_END
