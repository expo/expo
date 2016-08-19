/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTDefines.h"

#if ABI9_0_0RCT_DEV // Only supported in dev mode

#import "ABI9_0_0RCTWebSocketProxyDelegate.h"

@protocol ABI9_0_0RCTWebSocketProxy

+ (instancetype)sharedInstance;

- (void)setDelegate:(id<ABI9_0_0RCTWebSocketProxyDelegate>)delegate forURL:(NSURL *)url;

- (instancetype) init   __attribute__((unavailable("init not available, call sharedInstance instead")));

@end

#endif
