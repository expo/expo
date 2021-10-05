/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI43_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI43_0_0RCTFunctionType) {
  ABI43_0_0RCTFunctionTypeNormal,
  ABI43_0_0RCTFunctionTypePromise,
  ABI43_0_0RCTFunctionTypeSync,
};

static inline const char *ABI43_0_0RCTFunctionDescriptorFromType(ABI43_0_0RCTFunctionType type)
{
  switch (type) {
    case ABI43_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI43_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI43_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI43_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI43_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI43_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
