/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI39_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI39_0_0RCTFunctionType) {
  ABI39_0_0RCTFunctionTypeNormal,
  ABI39_0_0RCTFunctionTypePromise,
  ABI39_0_0RCTFunctionTypeSync,
};

static inline const char *ABI39_0_0RCTFunctionDescriptorFromType(ABI39_0_0RCTFunctionType type)
{
  switch (type) {
    case ABI39_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI39_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI39_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI39_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI39_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI39_0_0RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments;

@end
