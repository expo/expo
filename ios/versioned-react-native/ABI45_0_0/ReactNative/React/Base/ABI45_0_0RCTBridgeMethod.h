/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI45_0_0RCTBridge;

typedef NS_ENUM(NSInteger, ABI45_0_0RCTFunctionType) {
  ABI45_0_0RCTFunctionTypeNormal,
  ABI45_0_0RCTFunctionTypePromise,
  ABI45_0_0RCTFunctionTypeSync,
};

static inline const char *ABI45_0_0RCTFunctionDescriptorFromType(ABI45_0_0RCTFunctionType type)
{
  switch (type) {
    case ABI45_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI45_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI45_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI45_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI45_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI45_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
