/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI21_0_0/ABI21_0_0RCTPackagerClient.h>

@class ABI21_0_0RCTBridge;

#if ABI21_0_0RCT_DEV // Only supported in dev mode

@interface ABI21_0_0RCTReloadPackagerMethod : NSObject <ABI21_0_0RCTPackagerClientMethod>

- (instancetype)initWithBridge:(ABI21_0_0RCTBridge *)bridge;

@end

#endif
