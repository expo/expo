/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI49_0_0RCTBridge;

typedef NS_ENUM(NSInteger, ABI49_0_0RCTFunctionType) {
  ABI49_0_0RCTFunctionTypeNormal,
  ABI49_0_0RCTFunctionTypePromise,
  ABI49_0_0RCTFunctionTypeSync,
};

static inline const char *ABI49_0_0RCTFunctionDescriptorFromType(ABI49_0_0RCTFunctionType type)
{
  switch (type) {
    case ABI49_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI49_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI49_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI49_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI49_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI49_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
