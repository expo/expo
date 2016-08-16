/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTDefines.h"

#if ABI6_0_0RCT_DEV // Debug executors are only supported in dev mode

#import "ABI6_0_0RCTJavaScriptExecutor.h"

@interface ABI6_0_0RCTWebSocketExecutor : NSObject <ABI6_0_0RCTJavaScriptExecutor>

- (instancetype)initWithURL:(NSURL *)URL;

@end

#endif
