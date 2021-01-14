/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

#if SWIFT_PACKAGE
#import "GoogleUtilities/AppDelegateSwizzler/Private/GULApplication.h"
#else
#import <GoogleUtilities/GULApplication.h>
#endif

NS_ASSUME_NONNULL_BEGIN

typedef NSString *const GULAppDelegateInterceptorID;

/** This class contains methods that isa swizzle the app delegate. */
@interface GULAppDelegateSwizzler : NSProxy

/** Registers an app delegate interceptor whose methods will be invoked as they're invoked on the
 *  original app delegate.
 *
 *  @param interceptor An instance of a class that conforms to the application delegate protocol.
 *      The interceptor is NOT retained.
 *  @return A unique GULAppDelegateInterceptorID if interceptor was successfully registered; nil
 *      if it fails.
 */
+ (nullable GULAppDelegateInterceptorID)registerAppDelegateInterceptor:
    (id<GULApplicationDelegate>)interceptor;

/** Unregisters an interceptor with the given ID if it exists.
 *
 *  @param interceptorID The object that was generated when the interceptor was registered.
 */
+ (void)unregisterAppDelegateInterceptorWithID:(GULAppDelegateInterceptorID)interceptorID;

/** This method ensures that the original app delegate has been proxied. Call this before
 *  registering your interceptor. This method is safe to call multiple times (but it only proxies
 *  the app delegate once).
 *
 *  This method doesn't proxy APNS related methods:
 *  @code
 *    - application:didRegisterForRemoteNotificationsWithDeviceToken:
 *    - application:didFailToRegisterForRemoteNotificationsWithError:
 *    - application:didReceiveRemoteNotification:fetchCompletionHandler:
 *    - application:didReceiveRemoteNotification:
 *  @endcode
 *
 *  To proxy these methods use +[GULAppDelegateSwizzler
 *  proxyOriginalDelegateIncludingAPNSMethods]. The methods have to be proxied separately to
 *  avoid potential warnings from Apple review about missing Push Notification Entitlement (e.g.
 *  https://github.com/firebase/firebase-ios-sdk/issues/2807)
 *
 *  The method has no effect for extensions.
 *
 *  @see proxyOriginalDelegateIncludingAPNSMethods
 */
+ (void)proxyOriginalDelegate;

/** This method ensures that the original app delegate has been proxied including APNS related
 *  methods. Call this before registering your interceptor. This method is safe to call multiple
 *  times (but it only proxies the app delegate once) or
 *  after +[GULAppDelegateSwizzler proxyOriginalDelegate]
 *
 *  This method calls +[GULAppDelegateSwizzler proxyOriginalDelegate] under the hood.
 *  After calling this method the following App Delegate methods will be proxied in addition to
 *  the methods proxied by proxyOriginalDelegate:
 *  @code
 *    - application:didRegisterForRemoteNotificationsWithDeviceToken:
 *    - application:didFailToRegisterForRemoteNotificationsWithError:
 *    - application:didReceiveRemoteNotification:fetchCompletionHandler:
 *    - application:didReceiveRemoteNotification:
 *  @endcode
 *
 *  The method has no effect for extensions.
 *
 *  @see proxyOriginalDelegate
 */
+ (void)proxyOriginalDelegateIncludingAPNSMethods;

/** Indicates whether app delegate proxy is explicitly disabled or enabled. Enabled by default.
 *
 *  @return YES if AppDelegateProxy is Enabled, NO otherwise.
 */
+ (BOOL)isAppDelegateProxyEnabled;

/** Returns the current sharedApplication.
 *
 *  @return the current application instance if in an app, or nil if in extension or if it doesn't
 * exist.
 */
+ (nullable GULApplication *)sharedApplication;

/** Do not initialize this class. */
- (instancetype)init NS_UNAVAILABLE;

NS_ASSUME_NONNULL_END

@end
