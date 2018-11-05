/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI28_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI28_0_0RCTFunctionType) {
  ABI28_0_0RCTFunctionTypeNormal,
  ABI28_0_0RCTFunctionTypePromise,
  ABI28_0_0RCTFunctionTypeSync,
};

static inline const char *ABI28_0_0RCTFunctionDescriptorFromType(ABI28_0_0RCTFunctionType type) {
  switch (type) {
    case ABI28_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI28_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI28_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI28_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI28_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI28_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
