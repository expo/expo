/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class ABI10_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI10_0_0RCTFunctionType) {
  ABI10_0_0RCTFunctionTypeNormal,
  ABI10_0_0RCTFunctionTypePromise,
  ABI10_0_0RCTFunctionTypeSync,
};

@protocol ABI10_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, copy, readonly) NSString *JSMethodName;
@property (nonatomic, copy, readonly) NSDictionary *profileArgs;
@property (nonatomic, readonly) ABI10_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI10_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
