/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI48_0_0RCTBridge;

typedef NS_ENUM(NSInteger, ABI48_0_0RCTFunctionType) {
  ABI48_0_0RCTFunctionTypeNormal,
  ABI48_0_0RCTFunctionTypePromise,
  ABI48_0_0RCTFunctionTypeSync,
};

static inline const char *ABI48_0_0RCTFunctionDescriptorFromType(ABI48_0_0RCTFunctionType type)
{
  switch (type) {
    case ABI48_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI48_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI48_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI48_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI48_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI48_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
