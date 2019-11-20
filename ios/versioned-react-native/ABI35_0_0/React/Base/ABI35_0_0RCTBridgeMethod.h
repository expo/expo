/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI35_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI35_0_0RCTFunctionType) {
  ABI35_0_0RCTFunctionTypeNormal,
  ABI35_0_0RCTFunctionTypePromise,
  ABI35_0_0RCTFunctionTypeSync,
};

static inline const char *ABI35_0_0RCTFunctionDescriptorFromType(ABI35_0_0RCTFunctionType type) {
  switch (type) {
    case ABI35_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI35_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI35_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI35_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI35_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI35_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
