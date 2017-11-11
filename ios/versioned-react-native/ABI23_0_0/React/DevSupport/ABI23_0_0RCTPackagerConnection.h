/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI23_0_0/ABI23_0_0RCTDefines.h>

#if ABI23_0_0RCT_DEV

NS_ASSUME_NONNULL_BEGIN

@class ABI23_0_0RCTBridge;
@protocol ABI23_0_0RCTPackagerClientMethod;
@protocol ABI23_0_0RCTPackagerConnectionConfig;

/**
 * Encapsulates connection to ReactABI23_0_0 Native packager.
 * Dispatches messages from websocket to message handlers that must implement
 * <ABI23_0_0RCTPackagerClientMethod> protocol.
 * Message dispatch is performed on the main queue, unless message handler
 * provides its own queue by overriding "methodQueue" method.
 */
@interface ABI23_0_0RCTPackagerConnection : NSObject

+ (void)checkDefaultConnectionWithCallback:(void (^)(BOOL isRunning))callback
                                     queue:(dispatch_queue_t)queue;

+ (instancetype)connectionForBridge:(ABI23_0_0RCTBridge *)bridge;
- (instancetype)initWithConfig:(id<ABI23_0_0RCTPackagerConnectionConfig>)config;
- (void)addHandler:(id<ABI23_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name;
- (void)stop;

@end

NS_ASSUME_NONNULL_END

#endif
