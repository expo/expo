/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI31_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI31_0_0RCTFunctionType) {
  ABI31_0_0RCTFunctionTypeNormal,
  ABI31_0_0RCTFunctionTypePromise,
  ABI31_0_0RCTFunctionTypeSync,
};

static inline const char *ABI31_0_0RCTFunctionDescriptorFromType(ABI31_0_0RCTFunctionType type) {
  switch (type) {
    case ABI31_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI31_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI31_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI31_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI31_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI31_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
