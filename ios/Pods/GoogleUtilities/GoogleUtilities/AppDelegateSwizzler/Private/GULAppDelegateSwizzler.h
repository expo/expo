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

@protocol UIApplicationDelegate;

NS_ASSUME_NONNULL_BEGIN

typedef NSString *const GULAppDelegateInterceptorID;

/** This class contains methods that isa swizzle the app delegate. */
@interface GULAppDelegateSwizzler : NSProxy

/** Registers an app delegate interceptor whose methods will be invoked as they're invoked on the
 *  original app delegate.
 *
 *  @param interceptor An instance of a class that conforms to the UIApplicationDelegate protocol.
 *      The interceptor is NOT retained.
 *  @return A unique GULAppDelegateInterceptorID if interceptor was successfully registered; nil
 *      if it fails.
 */
+ (nullable GULAppDelegateInterceptorID)registerAppDelegateInterceptor:
    (id<UIApplicationDelegate>)interceptor;

/** Unregisters an interceptor with the given ID if it exists.
 *
 *  @param interceptorID The object that was generated when the interceptor was registered.
 */
+ (void)unregisterAppDelegateInterceptorWithID:(GULAppDelegateInterceptorID)interceptorID;

/** This method ensures that the original app delegate has been proxied. Call this before
 *  registering your interceptor. This method is safe to call multiple times (but it only proxies
 *  the app delegate once).
 */
+ (void)proxyOriginalDelegate NS_EXTENSION_UNAVAILABLE(
    "App delegate proxy doesn't support extensions.");

/** Indicates whether app delegate proxy is explicitly disabled or enabled. Enabled by default.
 *
 *  @return YES if AppDelegateProxy is Enabled, NO otherwise.
 */
+ (BOOL)isAppDelegateProxyEnabled;

/** Do not initialize this class. */
- (instancetype)init NS_UNAVAILABLE;

NS_ASSUME_NONNULL_END

@end
