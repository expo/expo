/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTDefines.h"

#if ABI10_0_0RCT_DEV // Only supported in dev mode

@protocol ABI10_0_0RCTWebSocketProxy;

@protocol ABI10_0_0RCTWebSocketProxyDelegate
- (void)socketProxy:(id<ABI10_0_0RCTWebSocketProxy>)sender didReceiveMessage:(NSDictionary<NSString *, id> *)message;
@end

#endif
