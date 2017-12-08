/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTPackagerConnectionConfig.h"

#if ABI24_0_0RCT_DEV // Only supported in dev mode

NS_ASSUME_NONNULL_BEGIN

@class ABI24_0_0RCTBridge;

@interface ABI24_0_0RCTPackagerConnectionBridgeConfig : NSObject <ABI24_0_0RCTPackagerConnectionConfig>

- (instancetype)initWithBridge:(ABI24_0_0RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END

#endif
