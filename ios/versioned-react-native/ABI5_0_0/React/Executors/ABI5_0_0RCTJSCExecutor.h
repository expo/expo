/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "ABI5_0_0RCTJavaScriptExecutor.h"

/**
 * Default name for the JS thread
 */
ABI5_0_0RCT_EXTERN NSString *const ABI5_0_0RCTJSCThreadName;

/**
 * This notification fires on the JS thread immediately after a `JSContext`
 * is fully initialized, but before the JS bundle has been loaded. The object
 * of this notification is the `JSContext`. Native modules should listen for
 * notification only if they need to install custom functionality into the
 * context. Note that this notification won't fire when debugging in Chrome.
 */
ABI5_0_0RCT_EXTERN NSString *const ABI5_0_0RCTJavaScriptContextCreatedNotification;

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
@interface ABI5_0_0RCTJSCExecutor : NSObject <ABI5_0_0RCTJavaScriptExecutor>

@end
