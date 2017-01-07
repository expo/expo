/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class ABI13_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI13_0_0RCTFunctionType) {
  ABI13_0_0RCTFunctionTypeNormal,
  ABI13_0_0RCTFunctionTypePromise,
  ABI13_0_0RCTFunctionTypeSync,
};

@protocol ABI13_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, copy, readonly) NSString *JSMethodName;
@property (nonatomic, readonly) ABI13_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI13_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
