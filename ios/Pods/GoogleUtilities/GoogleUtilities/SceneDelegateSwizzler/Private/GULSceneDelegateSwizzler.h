/*
 * Copyright 2019 Google LLC
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

#if !TARGET_OS_OSX
#import <UIKit/UIKit.h>
#endif  // !TARGET_OS_OSX

#if ((TARGET_OS_IOS || TARGET_OS_TV) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 130000))
#define UISCENE_SUPPORTED 1
#endif

NS_ASSUME_NONNULL_BEGIN

typedef NSString *const GULSceneDelegateInterceptorID;

/** This class contains methods that isa swizzle the scene delegate. */
@interface GULSceneDelegateSwizzler : NSProxy

#if UISCENE_SUPPORTED

/** Registers a scene delegate interceptor whose methods will be invoked as they're invoked on the
 *  original scene delegate.
 *
 *  @param interceptor An instance of a class that conforms to the application delegate protocol.
 *      The interceptor is NOT retained.
 *  @return A unique GULSceneDelegateInterceptorID if interceptor was successfully registered; nil
 *      if it fails.
 */
+ (nullable GULSceneDelegateInterceptorID)registerSceneDelegateInterceptor:
    (id<UISceneDelegate>)interceptor API_AVAILABLE(ios(13.0), tvos(13.0));

/** Unregisters an interceptor with the given ID if it exists.
 *
 *  @param interceptorID The object that was generated when the interceptor was registered.
 */
+ (void)unregisterSceneDelegateInterceptorWithID:(GULSceneDelegateInterceptorID)interceptorID
    API_AVAILABLE(ios(13.0), tvos(13.0));

/** Do not initialize this class. */
- (instancetype)init NS_UNAVAILABLE;

#endif  // UISCENE_SUPPORTED

/** This method ensures that the original scene delegate has been proxied. Call this before
 *  registering your interceptor. This method is safe to call multiple times (but it only proxies
 *  the scene delegate once).
 *
 *  The method has no effect for extensions.
 */
+ (void)proxyOriginalSceneDelegate;

/** Indicates whether scene delegate proxy is explicitly disabled or enabled. Enabled by default.
 *
 *  @return YES if SceneDelegateProxy is Enabled, NO otherwise.
 */
+ (BOOL)isSceneDelegateProxyEnabled;

@end

NS_ASSUME_NONNULL_END
