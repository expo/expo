/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class ABI22_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI22_0_0RCTFunctionType) {
  ABI22_0_0RCTFunctionTypeNormal,
  ABI22_0_0RCTFunctionTypePromise,
  ABI22_0_0RCTFunctionTypeSync,
};

static inline const char *ABI22_0_0RCTFunctionDescriptorFromType(ABI22_0_0RCTFunctionType type) {
  switch (type) {
    case ABI22_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI22_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI22_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI22_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI22_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI22_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
