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

#import <GoogleUtilities/GULAppDelegateSwizzler.h>
#import <GoogleUtilities/GULMutableDictionary.h>

@class GULApplication;

NS_ASSUME_NONNULL_BEGIN

@interface GULAppDelegateSwizzler ()

/** ISA Swizzles the given appDelegate as the original app delegate would be.
 *
 *  @param appDelegate The object that needs to be isa swizzled. This should conform to the
 *      application delegate protocol.
 */
+ (void)proxyAppDelegate:(id<GULApplicationDelegate>)appDelegate;

/** Returns a dictionary containing interceptor IDs mapped to a GULZeroingWeakContainer.
 *
 *  @return A dictionary of the form {NSString : GULZeroingWeakContainer}, where the NSString is
 *      the interceptorID.
 */
+ (GULMutableDictionary *)interceptors;

#ifdef GUL_APP_DELEGATE_TESTING  // Methods only used in tests.

/** Deletes all the registered interceptors. */
+ (void)clearInterceptors;

/** Resets the token that prevents the app delegate proxy from being isa swizzled multiple times. */
+ (void)resetProxyOriginalDelegateOnceToken;

/** Returns the original app delegate that was proxied.
 *
 *  @return The original app delegate instance that was proxied.
 */
+ (id<GULApplicationDelegate>)originalDelegate;

#endif  // GUL_APP_DELEGATE_TESTING

@end

NS_ASSUME_NONNULL_END
