/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI24_0_0/ABI24_0_0RCTDefines.h>

#if ABI24_0_0RCT_DEV

NS_ASSUME_NONNULL_BEGIN

@class ABI24_0_0RCTBridge;
@protocol ABI24_0_0RCTPackagerClientMethod;
@protocol ABI24_0_0RCTPackagerConnectionConfig;

/**
 * Encapsulates connection to ReactABI24_0_0 Native packager.
 * Dispatches messages from websocket to message handlers that must implement
 * <ABI24_0_0RCTPackagerClientMethod> protocol.
 * Message dispatch is performed on the main queue, unless message handler
 * provides its own queue by overriding "methodQueue" method.
 */
@interface ABI24_0_0RCTPackagerConnection : NSObject

+ (void)checkDefaultConnectionWithCallback:(void (^)(BOOL isRunning))callback
                                     queue:(dispatch_queue_t)queue;

+ (instancetype)connectionForBridge:(ABI24_0_0RCTBridge *)bridge;
- (instancetype)initWithConfig:(id<ABI24_0_0RCTPackagerConnectionConfig>)config;
- (void)addHandler:(id<ABI24_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name;
- (void)stop;

@end

NS_ASSUME_NONNULL_END

#endif
