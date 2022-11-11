/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI47_0_0RCTBridge;

typedef NS_ENUM(NSInteger, ABI47_0_0RCTFunctionType) {
  ABI47_0_0RCTFunctionTypeNormal,
  ABI47_0_0RCTFunctionTypePromise,
  ABI47_0_0RCTFunctionTypeSync,
};

static inline const char *ABI47_0_0RCTFunctionDescriptorFromType(ABI47_0_0RCTFunctionType type)
{
  switch (type) {
    case ABI47_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI47_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI47_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI47_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI47_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI47_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
