/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// GTMSessionFetcher is a wrapper around NSURLSession for http operations.
//
// What does this offer on top of of NSURLSession?
//
// - Block-style callbacks for useful functionality like progress rather
//   than delegate methods.
// - Out-of-process uploads and downloads using NSURLSession, including
//   management of fetches after relaunch.
// - Integration with GTMAppAuth for invisible management and refresh of
//   authorization tokens.
// - Pretty-printed http logging.
// - Cookies handling that does not interfere with or get interfered with
//   by WebKit cookies or on Mac by Safari and other apps.
// - Credentials handling for the http operation.
// - Rate-limiting and cookie grouping when fetchers are created with
//   GTMSessionFetcherService.
//
// If the bodyData or bodyFileURL property is set, then a POST request is assumed.
//
// Each fetcher is assumed to be for a one-shot fetch request; don't reuse the object
// for a second fetch.
//
// The fetcher will be self-retained as long as a connection is pending.
//
// To keep user activity private, URLs must have an https scheme (unless the property
// allowedInsecureSchemes is set to permit the scheme.)
//
// Callbacks will be released when the fetch completes or is stopped, so there is no need
// to use weak self references in the callback blocks.
//
// Sample usage:
//
//  _fetcherService = [[GTMSessionFetcherService alloc] init];
//
//  GTMSessionFetcher *myFetcher = [_fetcherService fetcherWithURLString:myURLString];
//  myFetcher.retryEnabled = YES;
//  myFetcher.comment = @"First profile image";
//
//  // Optionally specify a file URL or NSData for the request body to upload.
//  myFetcher.bodyData = [postString dataUsingEncoding:NSUTF8StringEncoding];
//
//  [myFetcher beginFetchWithCompletionHandler:^(NSData *data, NSError *error) {
//    if (error != nil) {
//      // Server status code or network error.
//      //
//      // If the domain is kGTMSessionFetcherStatusDomain then the error code
//      // is a failure status from the server.
//    } else {
//      // Fetch succeeded.
//    }
//  }];
//
// There is also a beginFetch call that takes a pointer and selector for the completion handler;
// a pointer and selector is a better style when the callback is a substantial, separate method.
//
// NOTE:  Fetches may retrieve data from the server even though the server
//        returned an error, so the criteria for success is a non-nil error.
//        The completion handler is called when the server status is >= 300 with an NSError
//        having domain kGTMSessionFetcherStatusDomain and code set to the server status.
//
//        Status codes are at <http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html>
//
//
// Background session support:
//
// Out-of-process uploads and downloads may be created by setting the fetcher's
// useBackgroundSession property. Data to be uploaded should be provided via
// the uploadFileURL property; the download destination should be specified with
// the destinationFileURL.  NOTE: Background upload files should be in a location
// that will be valid even after the device is restarted, so the file should not
// be uploaded from a system temporary or cache directory.
//
// Background session transfers are slower, and should typically be used only
// for very large downloads or uploads (hundreds of megabytes).
//
// When background sessions are used in iOS apps, the application delegate must
// pass through the parameters from UIApplicationDelegate's
// application:handleEventsForBackgroundURLSession:completionHandler: to the
// fetcher class.
//
// When the application has been relaunched, it may also create a new fetcher
// instance to handle completion of the transfers.
//
//  - (void)application:(UIApplication *)application
//      handleEventsForBackgroundURLSession:(NSString *)identifier
//                        completionHandler:(void (^)())completionHandler {
//    // Application was re-launched on completing an out-of-process download.
//
//    // Pass the URLSession info related to this re-launch to the fetcher class.
//    [GTMSessionFetcher application:application
//        handleEventsForBackgroundURLSession:identifier
//                          completionHandler:completionHandler];
//
//    // Get a fetcher related to this re-launch and re-hook up a completionHandler to it.
//    GTMSessionFetcher *fetcher = [GTMSessionFetcher fetcherWithSessionIdentifier:identifier];
//    NSURL *destinationFileURL = fetcher.destinationFileURL;
//    fetcher.completionHandler = ^(NSData *data, NSError *error) {
//      [self downloadCompletedToFile:destinationFileURL error:error];
//    };
//  }
//
//
// Threading and queue support:
//
// Networking always happens on a background thread; there is no advantage to
// changing thread or queue to create or start a fetcher.
//
// Callbacks are run on the main thread; alternatively, the app may set the
// fetcher's callbackQueue to a dispatch queue.
//
// Once the fetcher's beginFetch method has been called, the fetcher's methods and
// properties may be accessed from any thread.
//
// Downloading to disk:
//
// To have downloaded data saved directly to disk, specify a file URL for the
// destinationFileURL property.
//
// HTTP methods and headers:
//
// Alternative HTTP methods, like PUT, and custom headers can be specified by
// creating the fetcher with an appropriate NSMutableURLRequest.
//
//
// Caching:
//
// The fetcher avoids caching. That is best for API requests, but may hurt
// repeat fetches of static data. Apps may enable a persistent disk cache by
// customizing the config:
//
//  fetcher.configurationBlock = ^(GTMSessionFetcher *configFetcher,
//                                 NSURLSessionConfiguration *config) {
//    config.URLCache = [NSURLCache sharedURLCache];
//  };
//
// Or use the standard system config to share cookie storage with web views
// and to enable disk caching:
//
//  fetcher.configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
//
//
// Cookies:
//
// There are three supported mechanisms for remembering cookies between fetches.
//
// By default, a standalone GTMSessionFetcher uses a mutable array held
// statically to track cookies for all instantiated fetchers.  This avoids
// cookies being set by servers for the application from interfering with
// Safari and WebKit cookie settings, and vice versa.
// The fetcher cookies are lost when the application quits.
//
// To rely instead on WebKit's global NSHTTPCookieStorage, set the fetcher's
// cookieStorage property:
//   myFetcher.cookieStorage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
//
// To share cookies with other apps, use the method introduced in iOS 9/OS X 10.11:
//   myFetcher.cookieStorage =
//     [NSHTTPCookieStorage sharedCookieStorageForGroupContainerIdentifier:kMyCompanyContainedID];
//
// To ignore existing cookies and only have cookies related to the single fetch
// be applied, make a temporary cookie storage object:
//   myFetcher.cookieStorage = [[GTMSessionCookieStorage alloc] init];
//
// Note: cookies set while following redirects will be sent to the server, as
// the redirects are followed by the fetcher.
//
// To completely disable cookies, similar to setting cookieStorageMethod to
// kGTMHTTPFetcherCookieStorageMethodNone, adjust the session configuration
// appropriately in the fetcher or fetcher service:
//  fetcher.configurationBlock = ^(GTMSessionFetcher *configFetcher,
//                                 NSURLSessionConfiguration *config) {
//    config.HTTPCookieAcceptPolicy = NSHTTPCookieAcceptPolicyNever;
//    config.HTTPShouldSetCookies = NO;
//  };
//
// If the fetcher is created from a GTMSessionFetcherService object
// then the cookie storage mechanism is set to use the cookie storage in the
// service object rather than the static storage. Disabling cookies in the
// session configuration set on a service object will disable cookies for all
// fetchers created from that GTMSessionFetcherService object, since the session
// configuration is propagated to the fetcher.
//
//
// Monitoring data transfers.
//
// The fetcher supports a variety of properties for progress monitoring
// progress with callback blocks.
//  GTMSessionFetcherSendProgressBlock sendProgressBlock
//  GTMSessionFetcherReceivedProgressBlock receivedProgressBlock
//  GTMSessionFetcherDownloadProgressBlock downloadProgressBlock
//
// If supplied by the server, the anticipated total download size is available
// as [[myFetcher response] expectedContentLength] (and may be -1 for unknown
// download sizes.)
//
//
// Automatic retrying of fetches
//
// The fetcher can optionally create a timer and reattempt certain kinds of
// fetch failures (status codes 408, request timeout; 502, gateway failure;
// 503, service unavailable; 504, gateway timeout; networking errors
// NSURLErrorTimedOut and NSURLErrorNetworkConnectionLost.)  The user may
// set a retry selector to customize the type of errors which will be retried.
//
// Retries are done in an exponential-backoff fashion (that is, after 1 second,
// 2, 4, 8, and so on.)
//
// Enabling automatic retries looks like this:
//  myFetcher.retryEnabled = YES;
//
// With retries enabled, the completion callbacks are called only
// when no more retries will be attempted. Calling the fetcher's stopFetching
// method will terminate the retry timer, without the finished or failure
// selectors being invoked.
//
// Optionally, the client may set the maximum retry interval:
//  myFetcher.maxRetryInterval = 60.0; // in seconds; default is 60 seconds
//                                     // for downloads, 600 for uploads
//
// Servers should never send a 400 or 500 status for errors that are retryable
// by clients, as those values indicate permanent failures. In nearly all
// cases, the default standard retry behavior is correct for clients, and no
// custom client retry behavior is needed or appropriate. Servers that send
// non-retryable status codes and expect the client to retry the request are
// faulty.
//
// Still, the client may provide a block to determine if a status code or other
// error should be retried. The block returns YES to set the retry timer or NO
// to fail without additional fetch attempts.
//
// The retry method may return the |suggestedWillRetry| argument to get the
// default retry behavior.  Server status codes are present in the
// error argument, and have the domain kGTMSessionFetcherStatusDomain. The
// user's method may look something like this:
//
//  myFetcher.retryBlock = ^(BOOL suggestedWillRetry, NSError *error,
//                           GTMSessionFetcherRetryResponse response) {
//    // Perhaps examine error.domain and error.code, or fetcher.retryCount
//    //
//    // Respond with YES to start the retry timer, NO to proceed to the failure
//    // callback, or suggestedWillRetry to get default behavior for the
//    // current error domain and code values.
//    response(suggestedWillRetry);
//  };


#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#endif
#if TARGET_OS_WATCH
#import <WatchKit/WatchKit.h>
#endif

// By default it is stripped from non DEBUG builds. Developers can override
// this in their project settings.
#ifndef STRIP_GTM_FETCH_LOGGING
  #if !DEBUG
    #define STRIP_GTM_FETCH_LOGGING 1
  #else
    #define STRIP_GTM_FETCH_LOGGING 0
  #endif
#endif

// Logs in debug builds.
#ifndef GTMSESSION_LOG_DEBUG
  #if DEBUG
    #define GTMSESSION_LOG_DEBUG(...) NSLog(__VA_ARGS__)
  #else
    #define GTMSESSION_LOG_DEBUG(...) do { } while (0)
  #endif
#endif

// Asserts in debug builds (or logs in debug builds if GTMSESSION_ASSERT_AS_LOG
// or NS_BLOCK_ASSERTIONS are defined.)
#ifndef GTMSESSION_ASSERT_DEBUG
  #if DEBUG && !defined(NS_BLOCK_ASSERTIONS) && !GTMSESSION_ASSERT_AS_LOG
    #undef GTMSESSION_ASSERT_AS_LOG
    #define GTMSESSION_ASSERT_AS_LOG 1
  #endif

  #if DEBUG && !GTMSESSION_ASSERT_AS_LOG
    #define GTMSESSION_ASSERT_DEBUG(...) NSAssert(__VA_ARGS__)
  #elif DEBUG
    #define GTMSESSION_ASSERT_DEBUG(pred, ...) if (!(pred)) { NSLog(__VA_ARGS__); }
  #else
    #define GTMSESSION_ASSERT_DEBUG(pred, ...) do { } while (0)
  #endif
#endif

// Asserts in debug builds, logs in release builds (or logs in debug builds if
// GTMSESSION_ASSERT_AS_LOG is defined.)
#ifndef GTMSESSION_ASSERT_DEBUG_OR_LOG
  #if DEBUG && !GTMSESSION_ASSERT_AS_LOG
    #define GTMSESSION_ASSERT_DEBUG_OR_LOG(...) NSAssert(__VA_ARGS__)
  #else
    #define GTMSESSION_ASSERT_DEBUG_OR_LOG(pred, ...) if (!(pred)) { NSLog(__VA_ARGS__); }
  #endif
#endif

// Macro useful for examining messages from NSURLSession during debugging.
#if 0
#define GTM_LOG_SESSION_DELEGATE(...) GTMSESSION_LOG_DEBUG(__VA_ARGS__)
#else
#define GTM_LOG_SESSION_DELEGATE(...)
#endif

#ifndef GTM_NULLABLE
  #if __has_feature(nullability)  // Available starting in Xcode 6.3
    #define GTM_NULLABLE_TYPE __nullable
    #define GTM_NONNULL_TYPE __nonnull
    #define GTM_NULLABLE nullable
    #define GTM_NONNULL_DECL nonnull  // GTM_NONNULL is used by GTMDefines.h
    #define GTM_NULL_RESETTABLE null_resettable

    #define GTM_ASSUME_NONNULL_BEGIN NS_ASSUME_NONNULL_BEGIN
    #define GTM_ASSUME_NONNULL_END NS_ASSUME_NONNULL_END
  #else
    #define GTM_NULLABLE_TYPE
    #define GTM_NONNULL_TYPE
    #define GTM_NULLABLE
    #define GTM_NONNULL_DECL
    #define GTM_NULL_RESETTABLE
    #define GTM_ASSUME_NONNULL_BEGIN
    #define GTM_ASSUME_NONNULL_END
  #endif  // __has_feature(nullability)
#endif  // GTM_NULLABLE

#if (TARGET_OS_TV \
     || TARGET_OS_WATCH \
     || (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_12) && MAC_OS_X_VERSION_MAX_ALLOWED >= MAC_OS_X_VERSION_10_12) \
     || (TARGET_OS_IPHONE && defined(__IPHONE_10_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0))
#define GTMSESSION_DEPRECATE_ON_2016_SDKS(_MSG) __attribute__((deprecated("" _MSG)))
#else
#define GTMSESSION_DEPRECATE_ON_2016_SDKS(_MSG)
#endif

#ifndef GTM_DECLARE_GENERICS
  #if __has_feature(objc_generics)
    #define GTM_DECLARE_GENERICS 1
  #else
    #define GTM_DECLARE_GENERICS 0
  #endif
#endif

#ifndef GTM_NSArrayOf
  #if GTM_DECLARE_GENERICS
    #define GTM_NSArrayOf(value) NSArray<value>
    #define GTM_NSDictionaryOf(key, value) NSDictionary<key, value>
  #else
    #define GTM_NSArrayOf(value) NSArray
    #define GTM_NSDictionaryOf(key, value) NSDictionary
  #endif // __has_feature(objc_generics)
#endif  // GTM_NSArrayOf

// For iOS, the fetcher can declare itself a background task to allow fetches
// to finish when the app leaves the foreground.
//
// (This is unrelated to providing a background configuration, which allows
// out-of-process uploads and downloads.)
//
// To disallow use of background tasks during fetches, the target should define
// GTM_BACKGROUND_TASK_FETCHING to 0, or alternatively may set the
// skipBackgroundTask property to YES.
#if TARGET_OS_IPHONE && !TARGET_OS_WATCH && !defined(GTM_BACKGROUND_TASK_FETCHING)
  #define GTM_BACKGROUND_TASK_FETCHING 1
#endif

#ifdef __cplusplus
extern "C" {
#endif

#if (TARGET_OS_TV \
     || TARGET_OS_WATCH \
     || (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_11) && MAC_OS_X_VERSION_MAX_ALLOWED >= MAC_OS_X_VERSION_10_11) \
     || (TARGET_OS_IPHONE && defined(__IPHONE_9_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_9_0))
  #ifndef GTM_USE_SESSION_FETCHER
    #define GTM_USE_SESSION_FETCHER 1
  #endif
#endif

#if !defined(GTMBridgeFetcher)
  // These bridge macros should be identical in GTMHTTPFetcher.h and GTMSessionFetcher.h
  #if GTM_USE_SESSION_FETCHER
  // Macros to new fetcher class.
    #define GTMBridgeFetcher GTMSessionFetcher
    #define GTMBridgeFetcherService GTMSessionFetcherService
    #define GTMBridgeFetcherServiceProtocol GTMSessionFetcherServiceProtocol
    #define GTMBridgeAssertValidSelector GTMSessionFetcherAssertValidSelector
    #define GTMBridgeCookieStorage GTMSessionCookieStorage
    #define GTMBridgeCleanedUserAgentString GTMFetcherCleanedUserAgentString
    #define GTMBridgeSystemVersionString GTMFetcherSystemVersionString
    #define GTMBridgeApplicationIdentifier GTMFetcherApplicationIdentifier
    #define kGTMBridgeFetcherStatusDomain kGTMSessionFetcherStatusDomain
    #define kGTMBridgeFetcherStatusBadRequest GTMSessionFetcherStatusBadRequest
  #else
    // Macros to old fetcher class.
    #define GTMBridgeFetcher GTMHTTPFetcher
    #define GTMBridgeFetcherService GTMHTTPFetcherService
    #define GTMBridgeFetcherServiceProtocol GTMHTTPFetcherServiceProtocol
    #define GTMBridgeAssertValidSelector GTMAssertSelectorNilOrImplementedWithArgs
    #define GTMBridgeCookieStorage GTMCookieStorage
    #define GTMBridgeCleanedUserAgentString GTMCleanedUserAgentString
    #define GTMBridgeSystemVersionString GTMSystemVersionString
    #define GTMBridgeApplicationIdentifier GTMApplicationIdentifier
    #define kGTMBridgeFetcherStatusDomain kGTMHTTPFetcherStatusDomain
    #define kGTMBridgeFetcherStatusBadRequest kGTMHTTPFetcherStatusBadRequest
  #endif  // GTM_USE_SESSION_FETCHER
#endif

GTM_ASSUME_NONNULL_BEGIN

// Notifications
//
// Fetch started and stopped, and fetch retry delay started and stopped.
extern NSString *const kGTMSessionFetcherStartedNotification;
extern NSString *const kGTMSessionFetcherStoppedNotification;
extern NSString *const kGTMSessionFetcherRetryDelayStartedNotification;
extern NSString *const kGTMSessionFetcherRetryDelayStoppedNotification;

// Completion handler notification. This is intended for use by code capturing
// and replaying fetch requests and results for testing. For fetches where
// destinationFileURL or accumulateDataBlock is set for the fetcher, the data
// will be nil for successful fetches.
//
// This notification is posted on the main thread.
extern NSString *const kGTMSessionFetcherCompletionInvokedNotification;
extern NSString *const kGTMSessionFetcherCompletionDataKey;
extern NSString *const kGTMSessionFetcherCompletionErrorKey;

// Constants for NSErrors created by the fetcher (excluding server status errors,
// and error objects originating in the OS.)
extern NSString *const kGTMSessionFetcherErrorDomain;

// The fetcher turns server error status values (3XX, 4XX, 5XX) into NSErrors
// with domain kGTMSessionFetcherStatusDomain.
//
// Any server response body data accompanying the status error is added to the
// userInfo dictionary with key kGTMSessionFetcherStatusDataKey.
extern NSString *const kGTMSessionFetcherStatusDomain;
extern NSString *const kGTMSessionFetcherStatusDataKey;
extern NSString *const kGTMSessionFetcherStatusDataContentTypeKey;

// When a fetch fails with an error, these keys are included in the error userInfo
// dictionary if retries were attempted.
extern NSString *const kGTMSessionFetcherNumberOfRetriesDoneKey;
extern NSString *const kGTMSessionFetcherElapsedIntervalWithRetriesKey;

// Background session support requires access to NSUserDefaults.
// If [NSUserDefaults standardUserDefaults] doesn't yield the correct NSUserDefaults for your usage,
// ie for an App Extension, then implement this class/method to return the correct NSUserDefaults.
// https://developer.apple.com/library/ios/documentation/General/Conceptual/ExtensibilityPG/ExtensionScenarios.html#//apple_ref/doc/uid/TP40014214-CH21-SW6
@interface GTMSessionFetcherUserDefaultsFactory : NSObject

+ (NSUserDefaults *)fetcherUserDefaults;

@end

#ifdef __cplusplus
}
#endif

typedef NS_ENUM(NSInteger, GTMSessionFetcherError) {
  GTMSessionFetcherErrorDownloadFailed = -1,
  GTMSessionFetcherErrorUploadChunkUnavailable = -2,
  GTMSessionFetcherErrorBackgroundExpiration = -3,
  GTMSessionFetcherErrorBackgroundFetchFailed = -4,
  GTMSessionFetcherErrorInsecureRequest = -5,
  GTMSessionFetcherErrorTaskCreationFailed = -6,
};

typedef NS_ENUM(NSInteger, GTMSessionFetcherStatus) {
  // Standard http status codes.
  GTMSessionFetcherStatusNotModified = 304,
  GTMSessionFetcherStatusBadRequest = 400,
  GTMSessionFetcherStatusUnauthorized = 401,
  GTMSessionFetcherStatusForbidden = 403,
  GTMSessionFetcherStatusPreconditionFailed = 412
};

#ifdef __cplusplus
extern "C" {
#endif

@class GTMSessionCookieStorage;
@class GTMSessionFetcher;

// The configuration block is for modifying the NSURLSessionConfiguration only.
// DO NOT change any fetcher properties in the configuration block.
typedef void (^GTMSessionFetcherConfigurationBlock)(GTMSessionFetcher *fetcher,
                                                    NSURLSessionConfiguration *configuration);
typedef void (^GTMSessionFetcherSystemCompletionHandler)(void);
typedef void (^GTMSessionFetcherCompletionHandler)(NSData * GTM_NULLABLE_TYPE data,
                                                   NSError * GTM_NULLABLE_TYPE error);
typedef void (^GTMSessionFetcherBodyStreamProviderResponse)(NSInputStream *bodyStream);
typedef void (^GTMSessionFetcherBodyStreamProvider)(GTMSessionFetcherBodyStreamProviderResponse response);
typedef void (^GTMSessionFetcherDidReceiveResponseDispositionBlock)(NSURLSessionResponseDisposition disposition);
typedef void (^GTMSessionFetcherDidReceiveResponseBlock)(NSURLResponse *response,
                                                         GTMSessionFetcherDidReceiveResponseDispositionBlock dispositionBlock);
typedef void (^GTMSessionFetcherChallengeDispositionBlock)(NSURLSessionAuthChallengeDisposition disposition,
                                                           NSURLCredential * GTM_NULLABLE_TYPE credential);
typedef void (^GTMSessionFetcherChallengeBlock)(GTMSessionFetcher *fetcher,
                                                NSURLAuthenticationChallenge *challenge,
                                                GTMSessionFetcherChallengeDispositionBlock dispositionBlock);
typedef void (^GTMSessionFetcherWillRedirectResponse)(NSURLRequest * GTM_NULLABLE_TYPE redirectedRequest);
typedef void (^GTMSessionFetcherWillRedirectBlock)(NSHTTPURLResponse *redirectResponse,
                                                   NSURLRequest *redirectRequest,
                                                   GTMSessionFetcherWillRedirectResponse response);
typedef void (^GTMSessionFetcherAccumulateDataBlock)(NSData * GTM_NULLABLE_TYPE buffer);
typedef void (^GTMSessionFetcherSimulateByteTransferBlock)(NSData * GTM_NULLABLE_TYPE buffer,
                                                           int64_t bytesWritten,
                                                           int64_t totalBytesWritten,
                                                           int64_t totalBytesExpectedToWrite);
typedef void (^GTMSessionFetcherReceivedProgressBlock)(int64_t bytesWritten,
                                                       int64_t totalBytesWritten);
typedef void (^GTMSessionFetcherDownloadProgressBlock)(int64_t bytesWritten,
                                                       int64_t totalBytesWritten,
                                                       int64_t totalBytesExpectedToWrite);
typedef void (^GTMSessionFetcherSendProgressBlock)(int64_t bytesSent,
                                                   int64_t totalBytesSent,
                                                   int64_t totalBytesExpectedToSend);
typedef void (^GTMSessionFetcherWillCacheURLResponseResponse)(NSCachedURLResponse * GTM_NULLABLE_TYPE cachedResponse);
typedef void (^GTMSessionFetcherWillCacheURLResponseBlock)(NSCachedURLResponse *proposedResponse,
                                                           GTMSessionFetcherWillCacheURLResponseResponse responseBlock);
typedef void (^GTMSessionFetcherRetryResponse)(BOOL shouldRetry);
typedef void (^GTMSessionFetcherRetryBlock)(BOOL suggestedWillRetry,
                                            NSError * GTM_NULLABLE_TYPE error,
                                            GTMSessionFetcherRetryResponse response);

typedef void (^GTMSessionFetcherTestResponse)(NSHTTPURLResponse * GTM_NULLABLE_TYPE response,
                                              NSData * GTM_NULLABLE_TYPE data,
                                              NSError * GTM_NULLABLE_TYPE error);
typedef void (^GTMSessionFetcherTestBlock)(GTMSessionFetcher *fetcherToTest,
                                           GTMSessionFetcherTestResponse testResponse);

void GTMSessionFetcherAssertValidSelector(id GTM_NULLABLE_TYPE obj, SEL GTM_NULLABLE_TYPE sel, ...);

// Utility functions for applications self-identifying to servers via a
// user-agent header

// The "standard" user agent includes the application identifier, taken from the bundle,
// followed by a space and the system version string. Pass nil to use +mainBundle as the source
// of the bundle identifier.
//
// Applications may use this as a starting point for their own user agent strings, perhaps
// with additional sections appended.  Use GTMFetcherCleanedUserAgentString() below to
// clean up any string being added to the user agent.
NSString *GTMFetcherStandardUserAgentString(NSBundle * GTM_NULLABLE_TYPE bundle);

// Make a generic name and version for the current application, like
// com.example.MyApp/1.2.3 relying on the bundle identifier and the
// CFBundleShortVersionString or CFBundleVersion.
//
// The bundle ID may be overridden as the base identifier string by
// adding to the bundle's Info.plist a "GTMUserAgentID" key.
//
// If no bundle ID or override is available, the process name preceded
// by "proc_" is used.
NSString *GTMFetcherApplicationIdentifier(NSBundle * GTM_NULLABLE_TYPE bundle);

// Make an identifier like "MacOSX/10.7.1" or "iPod_Touch/4.1 hw/iPod1_1"
NSString *GTMFetcherSystemVersionString(void);

// Make a parseable user-agent identifier from the given string, replacing whitespace
// and commas with underscores, and removing other characters that may interfere
// with parsing of the full user-agent string.
//
// For example, @"[My App]" would become @"My_App"
NSString *GTMFetcherCleanedUserAgentString(NSString *str);

// Grab the data from an input stream. Since streams cannot be assumed to be rewindable,
// this may be destructive; the caller can try to rewind the stream (by setting the
// NSStreamFileCurrentOffsetKey property) or can just use the NSData to make a new
// NSInputStream. This function is intended to facilitate testing rather than be used in
// production.
//
// This function operates synchronously on the current thread. Depending on how the
// input stream is implemented, it may be appropriate to dispatch to a different
// queue before calling this function.
//
// Failure is indicated by a returned data value of nil.
NSData * GTM_NULLABLE_TYPE GTMDataFromInputStream(NSInputStream *inputStream, NSError **outError);

#ifdef __cplusplus
}  // extern "C"
#endif


#if !GTM_USE_SESSION_FETCHER
@protocol GTMHTTPFetcherServiceProtocol;
#endif

// This protocol allows abstract references to the fetcher service, primarily for
// fetchers (which may be compiled without the fetcher service class present.)
//
// Apps should not need to use this protocol.
@protocol GTMSessionFetcherServiceProtocol <NSObject>
// This protocol allows us to call into the service without requiring
// GTMSessionFetcherService sources in this project

@property(atomic, strong) dispatch_queue_t callbackQueue;

- (BOOL)fetcherShouldBeginFetching:(GTMSessionFetcher *)fetcher;
- (void)fetcherDidCreateSession:(GTMSessionFetcher *)fetcher;
- (void)fetcherDidBeginFetching:(GTMSessionFetcher *)fetcher;
- (void)fetcherDidStop:(GTMSessionFetcher *)fetcher;

- (GTMSessionFetcher *)fetcherWithRequest:(NSURLRequest *)request;
- (BOOL)isDelayingFetcher:(GTMSessionFetcher *)fetcher;

@property(atomic, assign) BOOL reuseSession;
- (GTM_NULLABLE NSURLSession *)session;
- (GTM_NULLABLE NSURLSession *)sessionForFetcherCreation;
- (GTM_NULLABLE id<NSURLSessionDelegate>)sessionDelegate;
- (GTM_NULLABLE NSDate *)stoppedAllFetchersDate;

// Methods for compatibility with the old GTMHTTPFetcher.
@property(readonly, strong, GTM_NULLABLE) NSOperationQueue *delegateQueue;

@end  // @protocol GTMSessionFetcherServiceProtocol

#ifndef GTM_FETCHER_AUTHORIZATION_PROTOCOL
#define GTM_FETCHER_AUTHORIZATION_PROTOCOL 1
@protocol GTMFetcherAuthorizationProtocol <NSObject>
@required
// This protocol allows us to call the authorizer without requiring its sources
// in this project.
- (void)authorizeRequest:(GTM_NULLABLE NSMutableURLRequest *)request
                delegate:(id)delegate
       didFinishSelector:(SEL)sel;

- (void)stopAuthorization;

- (void)stopAuthorizationForRequest:(NSURLRequest *)request;

- (BOOL)isAuthorizingRequest:(NSURLRequest *)request;

- (BOOL)isAuthorizedRequest:(NSURLRequest *)request;

@property(strong, readonly, GTM_NULLABLE) NSString *userEmail;

@optional

// Indicate if authorization may be attempted. Even if this succeeds,
// authorization may fail if the user's permissions have been revoked.
@property(readonly) BOOL canAuthorize;

// For development only, allow authorization of non-SSL requests, allowing
// transmission of the bearer token unencrypted.
@property(assign) BOOL shouldAuthorizeAllRequests;

- (void)authorizeRequest:(GTM_NULLABLE NSMutableURLRequest *)request
       completionHandler:(void (^)(NSError * GTM_NULLABLE_TYPE error))handler;

#if GTM_USE_SESSION_FETCHER
@property (weak, GTM_NULLABLE) id<GTMSessionFetcherServiceProtocol> fetcherService;
#else
@property (weak, GTM_NULLABLE) id<GTMHTTPFetcherServiceProtocol> fetcherService;
#endif

- (BOOL)primeForRefresh;

@end
#endif  // GTM_FETCHER_AUTHORIZATION_PROTOCOL

#if GTM_BACKGROUND_TASK_FETCHING
// A protocol for an alternative target for messages from GTMSessionFetcher to UIApplication.
// Set the target using +[GTMSessionFetcher setSubstituteUIApplication:]
@protocol GTMUIApplicationProtocol <NSObject>
- (UIBackgroundTaskIdentifier)beginBackgroundTaskWithName:(nullable NSString *)taskName
                                        expirationHandler:(void(^ __nullable)(void))handler;
- (void)endBackgroundTask:(UIBackgroundTaskIdentifier)identifier;
@end
#endif

#pragma mark -

// GTMSessionFetcher objects are used for async retrieval of an http get or post
//
// See additional comments at the beginning of this file
@interface GTMSessionFetcher : NSObject <NSURLSessionDelegate>

// Create a fetcher
//
// fetcherWithRequest will return an autoreleased fetcher, but if
// the connection is successfully created, the connection should retain the
// fetcher for the life of the connection as well. So the caller doesn't have
// to retain the fetcher explicitly unless they want to be able to cancel it.
+ (instancetype)fetcherWithRequest:(GTM_NULLABLE NSURLRequest *)request;

// Convenience methods that make a request, like +fetcherWithRequest
+ (instancetype)fetcherWithURL:(NSURL *)requestURL;
+ (instancetype)fetcherWithURLString:(NSString *)requestURLString;

// Methods for creating fetchers to continue previous fetches.
+ (instancetype)fetcherWithDownloadResumeData:(NSData *)resumeData;
+ (GTM_NULLABLE instancetype)fetcherWithSessionIdentifier:(NSString *)sessionIdentifier;

// Returns an array of currently active fetchers for background sessions,
// both restarted and newly created ones.
+ (GTM_NSArrayOf(GTMSessionFetcher *) *)fetchersForBackgroundSessions;

// Designated initializer.
//
// Applications should create fetchers with a "fetcherWith..." method on a fetcher
// service or a class method, not with this initializer.
//
// The configuration should typically be nil. Applications needing to customize
// the configuration may do so by setting the configurationBlock property.
- (instancetype)initWithRequest:(GTM_NULLABLE NSURLRequest *)request
                  configuration:(GTM_NULLABLE NSURLSessionConfiguration *)configuration;

// The fetcher's request.  This may not be set after beginFetch has been invoked. The request
// may change due to redirects.
@property(strong, GTM_NULLABLE) NSURLRequest *request;

// Set a header field value on the request. Header field value changes will not
// affect a fetch after the fetch has begun.
- (void)setRequestValue:(GTM_NULLABLE NSString *)value forHTTPHeaderField:(NSString *)field;

// The fetcher's request (deprecated.)
//
// Exposing a mutable object in the interface was convenient but a bad design decision due
// to thread-safety requirements.  Clients should use the request property and
// setRequestValue:forHTTPHeaderField: instead.
@property(atomic, readonly, GTM_NULLABLE) NSMutableURLRequest *mutableRequest
    GTMSESSION_DEPRECATE_ON_2016_SDKS("use 'request' or '-setRequestValue:forHTTPHeaderField:'");

// Data used for resuming a download task.
@property(atomic, readonly, GTM_NULLABLE) NSData *downloadResumeData;

// The configuration; this must be set before the fetch begins. If no configuration is
// set or inherited from the fetcher service, then the fetcher uses an ephemeral config.
//
// NOTE: This property should typically be nil. Applications needing to customize
// the configuration should do so by setting the configurationBlock property.
// That allows the fetcher to pick an appropriate base configuration, with the
// application setting only the configuration properties it needs to customize.
@property(atomic, strong, GTM_NULLABLE) NSURLSessionConfiguration *configuration;

// A block the client may use to customize the configuration used to create the session.
//
// This is called synchronously, either on the thread that begins the fetch or, during a retry,
// on the main thread. The configuration block may be called repeatedly if multiple fetchers are
// created.
//
// The configuration block is for modifying the NSURLSessionConfiguration only.
// DO NOT change any fetcher properties in the configuration block. Fetcher properties
// may be set in the fetcher service prior to fetcher creation, or on the fetcher prior
// to invoking beginFetch.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherConfigurationBlock configurationBlock;

// A session is created as needed by the fetcher.  A fetcher service object
// may maintain sessions for multiple fetches to the same host.
@property(atomic, strong, GTM_NULLABLE) NSURLSession *session;

// The task in flight.
@property(atomic, readonly, GTM_NULLABLE) NSURLSessionTask *sessionTask;

// The background session identifier.
@property(atomic, readonly, GTM_NULLABLE) NSString *sessionIdentifier;

// Indicates a fetcher created to finish a background session task.
@property(atomic, readonly) BOOL wasCreatedFromBackgroundSession;

// Additional user-supplied data to encode into the session identifier. Since session identifier
// length limits are unspecified, this should be kept small. Key names beginning with an underscore
// are reserved for use by the fetcher.
@property(atomic, strong, GTM_NULLABLE) GTM_NSDictionaryOf(NSString *, NSString *) *sessionUserInfo;

// The human-readable description to be assigned to the task.
@property(atomic, copy, GTM_NULLABLE) NSString *taskDescription;

// The priority assigned to the task, if any.  Use NSURLSessionTaskPriorityLow,
// NSURLSessionTaskPriorityDefault, or NSURLSessionTaskPriorityHigh.
@property(atomic, assign) float taskPriority;

// The fetcher encodes information used to resume a session in the session identifier.
// This method, intended for internal use returns the encoded information.  The sessionUserInfo
// dictionary is stored as identifier metadata.
- (GTM_NULLABLE GTM_NSDictionaryOf(NSString *, NSString *) *)sessionIdentifierMetadata;

#if TARGET_OS_IPHONE && !TARGET_OS_WATCH
// The app should pass to this method the completion handler passed in the app delegate method
// application:handleEventsForBackgroundURLSession:completionHandler:
+ (void)application:(UIApplication *)application
    handleEventsForBackgroundURLSession:(NSString *)identifier
                      completionHandler:(GTMSessionFetcherSystemCompletionHandler)completionHandler;
#endif

// Indicate that a newly created session should be a background session.
// A new session identifier will be created by the fetcher.
//
// Warning:  The only thing background sessions are for is rare download
// of huge, batched files of data. And even just for those, there's a lot
// of pain and hackery needed to get transfers to actually happen reliably
// with background sessions.
//
// Don't try to upload or download in many background sessions, since the system
// will impose an exponentially increasing time penalty to prevent the app from
// getting too much background execution time.
//
// References:
//
//   "Moving to Fewer, Larger Transfers"
//   https://forums.developer.apple.com/thread/14853
//
//   "NSURLSession’s Resume Rate Limiter"
//   https://forums.developer.apple.com/thread/14854
//
//   "Background Session Task state persistence"
//   https://forums.developer.apple.com/thread/11554
//
@property(assign) BOOL useBackgroundSession;

// Indicates if the fetcher was started using a background session.
@property(atomic, readonly, getter=isUsingBackgroundSession) BOOL usingBackgroundSession;

// Indicates if uploads should use an upload task.  This is always set for file or stream-provider
// bodies, but may be set explicitly for NSData bodies.
@property(atomic, assign) BOOL useUploadTask;

// Indicates that the fetcher is using a session that may be shared with other fetchers.
@property(atomic, readonly) BOOL canShareSession;

// By default, the fetcher allows only secure (https) schemes unless this
// property is set, or the GTM_ALLOW_INSECURE_REQUESTS build flag is set.
//
// For example, during debugging when fetching from a development server that lacks SSL support,
// this may be set to @[ @"http" ], or when the fetcher is used to retrieve local files,
// this may be set to @[ @"file" ].
//
// This should be left as nil for release builds to avoid creating the opportunity for
// leaking private user behavior and data.  If a server is providing insecure URLs
// for fetching by the client app, report the problem as server security & privacy bug.
//
// For builds with the iOS 9/OS X 10.11 and later SDKs, this property is required only when
// the app specifies NSAppTransportSecurity/NSAllowsArbitraryLoads in the main bundle's Info.plist.
@property(atomic, copy, GTM_NULLABLE) GTM_NSArrayOf(NSString *) *allowedInsecureSchemes;

// By default, the fetcher prohibits localhost requests unless this property is set,
// or the GTM_ALLOW_INSECURE_REQUESTS build flag is set.
//
// For localhost requests, the URL scheme is not checked  when this property is set.
//
// For builds with the iOS 9/OS X 10.11 and later SDKs, this property is required only when
// the app specifies NSAppTransportSecurity/NSAllowsArbitraryLoads in the main bundle's Info.plist.
@property(atomic, assign) BOOL allowLocalhostRequest;

// By default, the fetcher requires valid server certs.  This may be bypassed
// temporarily for development against a test server with an invalid cert.
@property(atomic, assign) BOOL allowInvalidServerCertificates;

// Cookie storage object for this fetcher. If nil, the fetcher will use a static cookie
// storage instance shared among fetchers. If this fetcher was created by a fetcher service
// object, it will be set to use the service object's cookie storage. See Cookies section above for
// the full discussion.
//
// Because as of Jan 2014 standalone instances of NSHTTPCookieStorage do not actually
// store any cookies (Radar 15735276) we use our own subclass, GTMSessionCookieStorage,
// to hold cookies in memory.
@property(atomic, strong, GTM_NULLABLE) NSHTTPCookieStorage *cookieStorage;

// Setting the credential is optional; it is used if the connection receives
// an authentication challenge.
@property(atomic, strong, GTM_NULLABLE) NSURLCredential *credential;

// Setting the proxy credential is optional; it is used if the connection
// receives an authentication challenge from a proxy.
@property(atomic, strong, GTM_NULLABLE) NSURLCredential *proxyCredential;

// If body data, body file URL, or body stream provider is not set, then a GET request
// method is assumed.
@property(atomic, strong, GTM_NULLABLE) NSData *bodyData;

// File to use as the request body. This forces use of an upload task.
@property(atomic, strong, GTM_NULLABLE) NSURL *bodyFileURL;

// Length of body to send, expected or actual.
@property(atomic, readonly) int64_t bodyLength;

// The body stream provider may be called repeatedly to provide a body.
// Setting a body stream provider forces use of an upload task.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherBodyStreamProvider bodyStreamProvider;

// Object to add authorization to the request, if needed.
//
// This may not be changed once beginFetch has been invoked.
@property(atomic, strong, GTM_NULLABLE) id<GTMFetcherAuthorizationProtocol> authorizer;

// The service object that created and monitors this fetcher, if any.
@property(atomic, strong) id<GTMSessionFetcherServiceProtocol> service;

// The host, if any, used to classify this fetcher in the fetcher service.
@property(atomic, copy, GTM_NULLABLE) NSString *serviceHost;

// The priority, if any, used for starting fetchers in the fetcher service.
//
// Lower values are higher priority; the default is 0, and values may
// be negative or positive. This priority affects only the start order of
// fetchers that are being delayed by a fetcher service when the running fetchers
// exceeds the service's maxRunningFetchersPerHost.  A priority of NSIntegerMin will
// exempt this fetcher from delay.
@property(atomic, assign) NSInteger servicePriority;

// The delegate's optional didReceiveResponse block may be used to inspect or alter
// the session task response.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherDidReceiveResponseBlock didReceiveResponseBlock;

// The delegate's optional challenge block may be used to inspect or alter
// the session task challenge.
//
// If this block is not set, the fetcher's default behavior for the NSURLSessionTask
// didReceiveChallenge: delegate method is to use the fetcher's respondToChallenge: method
// which relies on the fetcher's credential and proxyCredential properties.
//
// Warning: This may be called repeatedly if the challenge fails. Check
// challenge.previousFailureCount to identify repeated invocations.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherChallengeBlock challengeBlock;

// The delegate's optional willRedirect block may be used to inspect or alter
// the redirection.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherWillRedirectBlock willRedirectBlock;

// The optional send progress block reports body bytes uploaded.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherSendProgressBlock sendProgressBlock;

// The optional accumulate block may be set by clients wishing to accumulate data
// themselves rather than let the fetcher append each buffer to an NSData.
//
// When this is called with nil data (such as on redirect) the client
// should empty its accumulation buffer.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherAccumulateDataBlock accumulateDataBlock;

// The optional received progress block may be used to monitor data
// received from a data task.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherReceivedProgressBlock receivedProgressBlock;

// The delegate's optional downloadProgress block may be used to monitor download
// progress in writing to disk.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherDownloadProgressBlock downloadProgressBlock;

// The delegate's optional willCacheURLResponse block may be used to alter the cached
// NSURLResponse. The user may prevent caching by passing nil to the block's response.
//
// This is called on the callback queue.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherWillCacheURLResponseBlock willCacheURLResponseBlock;

// Enable retrying; see comments at the top of this file.  Setting
// retryEnabled=YES resets the min and max retry intervals.
@property(atomic, assign, getter=isRetryEnabled) BOOL retryEnabled;

// Retry block is optional for retries.
//
// If present, this block should call the response block with YES to cause a retry or NO to end the
// fetch.
// See comments at the top of this file.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherRetryBlock retryBlock;

// Retry intervals must be strictly less than maxRetryInterval, else
// they will be limited to maxRetryInterval and no further retries will
// be attempted.  Setting maxRetryInterval to 0.0 will reset it to the
// default value, 60 seconds for downloads and 600 seconds for uploads.
@property(atomic, assign) NSTimeInterval maxRetryInterval;

// Starting retry interval.  Setting minRetryInterval to 0.0 will reset it
// to a random value between 1.0 and 2.0 seconds.  Clients should normally not
// set this except for unit testing.
@property(atomic, assign) NSTimeInterval minRetryInterval;

// Multiplier used to increase the interval between retries, typically 2.0.
// Clients should not need to set this.
@property(atomic, assign) double retryFactor;

// Number of retries attempted.
@property(atomic, readonly) NSUInteger retryCount;

// Interval delay to precede next retry.
@property(atomic, readonly) NSTimeInterval nextRetryInterval;

#if GTM_BACKGROUND_TASK_FETCHING
// Skip use of a UIBackgroundTask, thus requiring fetches to complete when the app is in the
// foreground.
//
// Targets should define GTM_BACKGROUND_TASK_FETCHING to 0 to avoid use of a UIBackgroundTask
// on iOS to allow fetches to complete in the background.  This property is available when
// it's not practical to set the preprocessor define.
@property(atomic, assign) BOOL skipBackgroundTask;
#endif  // GTM_BACKGROUND_TASK_FETCHING

// Begin fetching the request
//
// The delegate may optionally implement the callback or pass nil for the selector or handler.
//
// The delegate and all callback blocks are retained between the beginFetch call until after the
// finish callback, or until the fetch is stopped.
//
// An error is passed to the callback for server statuses 300 or
// higher, with the status stored as the error object's code.
//
// finishedSEL has a signature like:
//   - (void)fetcher:(GTMSessionFetcher *)fetcher
//  finishedWithData:(NSData *)data
//             error:(NSError *)error;
//
// If the application has specified a destinationFileURL or an accumulateDataBlock
// for the fetcher, the data parameter passed to the callback will be nil.

- (void)beginFetchWithDelegate:(GTM_NULLABLE id)delegate
             didFinishSelector:(GTM_NULLABLE SEL)finishedSEL;

- (void)beginFetchWithCompletionHandler:(GTM_NULLABLE GTMSessionFetcherCompletionHandler)handler;

// Returns YES if this fetcher is in the process of fetching a URL.
@property(atomic, readonly, getter=isFetching) BOOL fetching;

// Cancel the fetch of the request that's currently in progress.  The completion handler
// will not be called.
- (void)stopFetching;

// A block to be called when the fetch completes.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherCompletionHandler completionHandler;

// A block to be called if download resume data becomes available.
@property(atomic, strong, GTM_NULLABLE) void (^resumeDataBlock)(NSData *);

// Return the status code from the server response.
@property(atomic, readonly) NSInteger statusCode;

// Return the http headers from the response.
@property(atomic, strong, readonly, GTM_NULLABLE) GTM_NSDictionaryOf(NSString *, NSString *) *responseHeaders;

// The response, once it's been received.
@property(atomic, strong, readonly, GTM_NULLABLE) NSURLResponse *response;

// Bytes downloaded so far.
@property(atomic, readonly) int64_t downloadedLength;

// Buffer of currently-downloaded data, if available.
@property(atomic, readonly, strong, GTM_NULLABLE) NSData *downloadedData;

// Local path to which the downloaded file will be moved.
//
// If a file already exists at the path, it will be overwritten.
// Will create the enclosing folders if they are not present.
@property(atomic, strong, GTM_NULLABLE) NSURL *destinationFileURL;

// The time this fetcher originally began fetching. This is useful as a time
// barrier for ignoring irrelevant fetch notifications or callbacks.
@property(atomic, strong, readonly, GTM_NULLABLE) NSDate *initialBeginFetchDate;

// userData is retained solely for the convenience of the client.
@property(atomic, strong, GTM_NULLABLE) id userData;

// Stored property values are retained solely for the convenience of the client.
@property(atomic, copy, GTM_NULLABLE) GTM_NSDictionaryOf(NSString *, id) *properties;

- (void)setProperty:(GTM_NULLABLE id)obj forKey:(NSString *)key;  // Pass nil for obj to remove the property.
- (GTM_NULLABLE id)propertyForKey:(NSString *)key;

- (void)addPropertiesFromDictionary:(GTM_NSDictionaryOf(NSString *, id) *)dict;

// Comments are useful for logging, so are strongly recommended for each fetcher.
@property(atomic, copy, GTM_NULLABLE) NSString *comment;

- (void)setCommentWithFormat:(NSString *)format, ... NS_FORMAT_FUNCTION(1, 2);

// Log of request and response, if logging is enabled
@property(atomic, copy, GTM_NULLABLE) NSString *log;

// Callbacks are run on this queue.  If none is supplied, the main queue is used.
@property(atomic, strong, GTM_NULL_RESETTABLE) dispatch_queue_t callbackQueue;

// The queue used internally by the session to invoke its delegate methods in the fetcher.
//
// Application callbacks are always called by the fetcher on the callbackQueue above,
// not on this queue. Apps should generally not change this queue.
//
// The default delegate queue is the main queue.
//
// This value is ignored after the session has been created, so this
// property should be set in the fetcher service rather in the fetcher as it applies
// to a shared session.
@property(atomic, strong, GTM_NULL_RESETTABLE) NSOperationQueue *sessionDelegateQueue;

// Spin the run loop or sleep the thread, discarding events, until the fetch has completed.
//
// This is only for use in testing or in tools without a user interface.
//
// Note:  Synchronous fetches should never be used by shipping apps; they are
// sufficient reason for rejection from the app store.
//
// Returns NO if timed out.
- (BOOL)waitForCompletionWithTimeout:(NSTimeInterval)timeoutInSeconds;

// Test block is optional for testing.
//
// If present, this block will cause the fetcher to skip starting the session, and instead
// use the test block response values when calling the completion handler and delegate code.
//
// Test code can set this on the fetcher or on the fetcher service.  For testing libraries
// that use a fetcher without exposing either the fetcher or the fetcher service, the global
// method setGlobalTestBlock: will set the block for all fetchers that do not have a test
// block set.
//
// The test code can pass nil for all response parameters to indicate that the fetch
// should proceed.
//
// Applications can exclude test block support by setting GTM_DISABLE_FETCHER_TEST_BLOCK.
@property(atomic, copy, GTM_NULLABLE) GTMSessionFetcherTestBlock testBlock;

+ (void)setGlobalTestBlock:(GTM_NULLABLE GTMSessionFetcherTestBlock)block;

// When using the testBlock, |testBlockAccumulateDataChunkCount| is the desired number of chunks to
// divide the response data into if the client has streaming enabled. The data will be divided up to
// |testBlockAccumulateDataChunkCount| chunks; however, the exact amount may vary depending on the
// size of the response data (e.g. a 1-byte response can only be divided into one chunk).
@property(atomic, readwrite) NSUInteger testBlockAccumulateDataChunkCount;

#if GTM_BACKGROUND_TASK_FETCHING
// For testing or to override UIApplication invocations, apps may specify an alternative
// target for messages to UIApplication.
+ (void)setSubstituteUIApplication:(nullable id<GTMUIApplicationProtocol>)substituteUIApplication;
+ (nullable id<GTMUIApplicationProtocol>)substituteUIApplication;
#endif  // GTM_BACKGROUND_TASK_FETCHING

// Exposed for testing.
+ (GTMSessionCookieStorage *)staticCookieStorage;
+ (BOOL)appAllowsInsecureRequests;

#if STRIP_GTM_FETCH_LOGGING
// If logging is stripped, provide a stub for the main method
// for controlling logging.
+ (void)setLoggingEnabled:(BOOL)flag;
+ (BOOL)isLoggingEnabled;

#else

// These methods let an application log specific body text, such as the text description of a binary
// request or response. The application should set the fetcher to defer response body logging until
// the response has been received and the log response body has been set by the app. For example:
//
//   fetcher.logRequestBody = [binaryObject stringDescription];
//   fetcher.deferResponseBodyLogging = YES;
//   [fetcher beginFetchWithCompletionHandler:^(NSData *data, NSError *error) {
//      if (error == nil) {
//        fetcher.logResponseBody = [[[MyThing alloc] initWithData:data] stringDescription];
//      }
//      fetcher.deferResponseBodyLogging = NO;
//   }];

@property(atomic, copy, GTM_NULLABLE) NSString *logRequestBody;
@property(atomic, assign) BOOL deferResponseBodyLogging;
@property(atomic, copy, GTM_NULLABLE) NSString *logResponseBody;

// Internal logging support.
@property(atomic, readonly) NSData *loggedStreamData;
@property(atomic, assign) BOOL hasLoggedError;
@property(atomic, strong, GTM_NULLABLE) NSURL *redirectedFromURL;
- (void)appendLoggedStreamData:(NSData *)dataToAdd;
- (void)clearLoggedStreamData;

#endif // STRIP_GTM_FETCH_LOGGING

@end

@interface GTMSessionFetcher (BackwardsCompatibilityOnly)
// Clients using GTMSessionFetcher should set the cookie storage explicitly themselves.
// This method is just for compatibility with the old GTMHTTPFetcher class.
- (void)setCookieStorageMethod:(NSInteger)method;
@end

// Until we can just instantiate NSHTTPCookieStorage for local use, we'll
// implement all the public methods ourselves.  This stores cookies only in
// memory.  Additional methods are provided for testing.
//
// iOS 9/OS X 10.11 added +[NSHTTPCookieStorage sharedCookieStorageForGroupContainerIdentifier:]
// which may also be used to create cookie storage.
@interface GTMSessionCookieStorage : NSHTTPCookieStorage

// Add the array off cookies to the storage, replacing duplicates.
// Also removes expired cookies from the storage.
- (void)setCookies:(GTM_NULLABLE GTM_NSArrayOf(NSHTTPCookie *) *)cookies;

- (void)removeAllCookies;

@end

// Macros to monitor synchronization blocks in debug builds.
// These report problems using GTMSessionCheckDebug.
//
// GTMSessionMonitorSynchronized           Start monitoring a top-level-only
//                                         @sync scope.
// GTMSessionMonitorRecursiveSynchronized  Start monitoring a top-level or
//                                         recursive @sync scope.
// GTMSessionCheckSynchronized             Verify that the current execution
//                                         is inside a @sync scope.
// GTMSessionCheckNotSynchronized          Verify that the current execution
//                                         is not inside a @sync scope.
//
// Example usage:
//
// - (void)myExternalMethod {
//   @synchronized(self) {
//     GTMSessionMonitorSynchronized(self)
//
// - (void)myInternalMethod {
//   GTMSessionCheckSynchronized(self);
//
// - (void)callMyCallbacks {
//   GTMSessionCheckNotSynchronized(self);
//
// GTMSessionCheckNotSynchronized is available for verifying the code isn't
// in a deadlockable @sync state when posting notifications and invoking
// callbacks. Don't use GTMSessionCheckNotSynchronized immediately before a
// @sync scope; the normal recursiveness check of GTMSessionMonitorSynchronized
// can catch those.

#ifdef __OBJC__
#if DEBUG
  #define __GTMSessionMonitorSynchronizedVariableInner(varname, counter) \
      varname ## counter
  #define __GTMSessionMonitorSynchronizedVariable(varname, counter)  \
      __GTMSessionMonitorSynchronizedVariableInner(varname, counter)

  #define GTMSessionMonitorSynchronized(obj)                                     \
      NS_VALID_UNTIL_END_OF_SCOPE id                                             \
        __GTMSessionMonitorSynchronizedVariable(__monitor, __COUNTER__) =        \
        [[GTMSessionSyncMonitorInternal alloc] initWithSynchronizationObject:obj \
                                                    allowRecursive:NO            \
                                                     functionName:__func__]

  #define GTMSessionMonitorRecursiveSynchronized(obj)                            \
      NS_VALID_UNTIL_END_OF_SCOPE id                                             \
        __GTMSessionMonitorSynchronizedVariable(__monitor, __COUNTER__) =        \
        [[GTMSessionSyncMonitorInternal alloc] initWithSynchronizationObject:obj \
                                                    allowRecursive:YES           \
                                                     functionName:__func__]

  #define GTMSessionCheckSynchronized(obj) {                                           \
      GTMSESSION_ASSERT_DEBUG(                                                         \
          [GTMSessionSyncMonitorInternal functionsHoldingSynchronizationOnObject:obj], \
          @"GTMSessionCheckSynchronized(" #obj ") failed: not sync'd"                  \
          @" on " #obj " in %s. Call stack:\n%@",                                      \
          __func__, [NSThread callStackSymbols]);                                      \
      }

  #define GTMSessionCheckNotSynchronized(obj) {                                       \
      GTMSESSION_ASSERT_DEBUG(                                                        \
        ![GTMSessionSyncMonitorInternal functionsHoldingSynchronizationOnObject:obj], \
        @"GTMSessionCheckNotSynchronized(" #obj ") failed: was sync'd"                \
        @" on " #obj " in %s by %@. Call stack:\n%@", __func__,                       \
        [GTMSessionSyncMonitorInternal functionsHoldingSynchronizationOnObject:obj],  \
        [NSThread callStackSymbols]);                                                 \
      }

// GTMSessionSyncMonitorInternal is a private class that keeps track of the
// beginning and end of synchronized scopes.
//
// This class should not be used directly, but only via the
// GTMSessionMonitorSynchronized macro.
@interface GTMSessionSyncMonitorInternal : NSObject
- (instancetype)initWithSynchronizationObject:(id)object
                               allowRecursive:(BOOL)allowRecursive
                                 functionName:(const char *)functionName;
// Return the names of the functions that hold sync on the object, or nil if none.
+ (NSArray *)functionsHoldingSynchronizationOnObject:(id)object;
@end

#else
  #define GTMSessionMonitorSynchronized(obj) do { } while (0)
  #define GTMSessionMonitorRecursiveSynchronized(obj) do { } while (0)
  #define GTMSessionCheckSynchronized(obj) do { } while (0)
  #define GTMSessionCheckNotSynchronized(obj) do { } while (0)
#endif  // !DEBUG
#endif  // __OBJC__


GTM_ASSUME_NONNULL_END
