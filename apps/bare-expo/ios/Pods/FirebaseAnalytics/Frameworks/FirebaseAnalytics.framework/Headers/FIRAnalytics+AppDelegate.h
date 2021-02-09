#import <Foundation/Foundation.h>

#import "FIRAnalytics.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Provides App Delegate handlers to be used in your App Delegate.
 *
 * To save time integrating Firebase Analytics in an application, Firebase Analytics does not
 * require delegation implementation from the AppDelegate. Instead this is automatically done by
 * Firebase Analytics. Should you choose instead to delegate manually, you can turn off the App
 * Delegate Proxy by adding FirebaseAppDelegateProxyEnabled into your app's Info.plist and setting
 * it to NO, and adding the methods in this category to corresponding delegation handlers.
 *
 * To handle Universal Links, you must return YES in
 * [UIApplicationDelegate application:didFinishLaunchingWithOptions:].
 */
@interface FIRAnalytics (AppDelegate)

/**
 * Handles events related to a URL session that are waiting to be processed.
 *
 * For optimal use of Firebase Analytics, call this method from the
 * [UIApplicationDelegate application:handleEventsForBackgroundURLSession:completionHandler]
 * method of the app delegate in your app.
 *
 * @param identifier The identifier of the URL session requiring attention.
 * @param completionHandler The completion handler to call when you finish processing the events.
 *     Calling this completion handler lets the system know that your app's user interface is
 *     updated and a new snapshot can be taken.
 */
+ (void)handleEventsForBackgroundURLSession:(NSString *)identifier
                          completionHandler:(nullable void (^)(void))completionHandler;

/**
 * Handles the event when the app is launched by a URL.
 *
 * Call this method from [UIApplicationDelegate application:openURL:options:] &#40;on iOS 9.0 and
 * above&#41;, or [UIApplicationDelegate application:openURL:sourceApplication:annotation:] &#40;on
 * iOS 8.x and below&#41; in your app.
 *
 * @param url The URL resource to open. This resource can be a network resource or a file.
 */
+ (void)handleOpenURL:(NSURL *)url;

/**
 * Handles the event when the app receives data associated with user activity that includes a
 * Universal Link (on iOS 9.0 and above).
 *
 * Call this method from [UIApplication continueUserActivity:restorationHandler:] in your app
 * delegate (on iOS 9.0 and above).
 *
 * @param userActivity The activity object containing the data associated with the task the user
 *     was performing.
 */
+ (void)handleUserActivity:(id)userActivity;

@end

NS_ASSUME_NONNULL_END

