/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI23_0_0/ABI23_0_0RCTPackagerClient.h>

@class ABI23_0_0RCTBridge;

#if ABI23_0_0RCT_DEV // Only supported in dev mode

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI23_0_0RCTReloadPackagerMethodBlock)(id);

@interface ABI23_0_0RCTReloadPackagerMethod : NSObject <ABI23_0_0RCTPackagerClientMethod>

- (instancetype)initWithReloadCommand:(ABI23_0_0RCTReloadPackagerMethodBlock)block callbackQueue:(dispatch_queue_t)callbackQueue;

@end

NS_ASSUME_NONNULL_END

#endif
