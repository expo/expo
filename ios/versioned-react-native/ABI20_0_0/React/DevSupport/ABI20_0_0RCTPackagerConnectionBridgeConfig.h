/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTPackagerConnectionConfig.h"

#if ABI20_0_0RCT_DEV // Only supported in dev mode

@class ABI20_0_0RCTBridge;

@interface ABI20_0_0RCTPackagerConnectionBridgeConfig : NSObject <ABI20_0_0RCTPackagerConnectionConfig>

- (instancetype)initWithBridge:(ABI20_0_0RCTBridge *)bridge;

@end

#endif
