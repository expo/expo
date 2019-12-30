/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI36_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI36_0_0RCTFunctionType) {
  ABI36_0_0RCTFunctionTypeNormal,
  ABI36_0_0RCTFunctionTypePromise,
  ABI36_0_0RCTFunctionTypeSync,
};

static inline const char *ABI36_0_0RCTFunctionDescriptorFromType(ABI36_0_0RCTFunctionType type) {
  switch (type) {
    case ABI36_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI36_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI36_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI36_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI36_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI36_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
