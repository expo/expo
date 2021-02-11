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

#import <Foundation/Foundation.h>
#import "GoogleUtilities/Network/Private/GULMutableDictionary.h"
#import "GoogleUtilities/SceneDelegateSwizzler/Private/GULSceneDelegateSwizzler.h"

NS_ASSUME_NONNULL_BEGIN

@interface GULSceneDelegateSwizzler ()

#if UISCENE_SUPPORTED

/** Returns a dictionary containing interceptor IDs mapped to a GULZeroingWeakContainer.
 *
 *  @return A dictionary of the form {NSString : GULZeroingWeakContainer}, where the NSString is
 *      the interceptorID.
 */
+ (GULMutableDictionary *)interceptors;

/** Deletes all the registered interceptors. */
+ (void)clearInterceptors;

/** ISA Swizzles the given appDelegate as the original app delegate would be.
 *
 *  @param scene The scene whose delegate needs to be isa swizzled. This should conform to the
 *      scene delegate protocol.
 */
+ (void)proxySceneDelegateIfNeeded:(UIScene *)scene API_AVAILABLE(ios(13.0), tvos(13.0));

#endif  // UISCENE_SUPPORTED

@end

NS_ASSUME_NONNULL_END
