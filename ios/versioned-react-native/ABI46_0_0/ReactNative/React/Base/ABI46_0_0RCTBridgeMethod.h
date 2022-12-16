/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI46_0_0RCTBridge;

typedef NS_ENUM(NSInteger, ABI46_0_0RCTFunctionType) {
  ABI46_0_0RCTFunctionTypeNormal,
  ABI46_0_0RCTFunctionTypePromise,
  ABI46_0_0RCTFunctionTypeSync,
};

static inline const char *ABI46_0_0RCTFunctionDescriptorFromType(ABI46_0_0RCTFunctionType type)
{
  switch (type) {
    case ABI46_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI46_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI46_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI46_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI46_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI46_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
