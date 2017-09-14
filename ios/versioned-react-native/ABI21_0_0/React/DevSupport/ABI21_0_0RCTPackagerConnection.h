/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI21_0_0/ABI21_0_0RCTDefines.h>

#if ABI21_0_0RCT_DEV

@class ABI21_0_0RCTBridge;
@protocol ABI21_0_0RCTPackagerClientMethod;
@protocol ABI21_0_0RCTPackagerConnectionConfig;

/**
 * Encapsulates connection to ReactABI21_0_0 Native packager
 */
@interface ABI21_0_0RCTPackagerConnection : NSObject

+ (instancetype)connectionForBridge:(ABI21_0_0RCTBridge *)bridge;
- (instancetype)initWithConfig:(id<ABI21_0_0RCTPackagerConnectionConfig>)config;
- (void)addHandler:(id<ABI21_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name;

@end

#endif
