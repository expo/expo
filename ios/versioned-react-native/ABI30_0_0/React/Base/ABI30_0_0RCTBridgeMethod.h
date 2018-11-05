/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI30_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI30_0_0RCTFunctionType) {
  ABI30_0_0RCTFunctionTypeNormal,
  ABI30_0_0RCTFunctionTypePromise,
  ABI30_0_0RCTFunctionTypeSync,
};

static inline const char *ABI30_0_0RCTFunctionDescriptorFromType(ABI30_0_0RCTFunctionType type) {
  switch (type) {
    case ABI30_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI30_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI30_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI30_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI30_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI30_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
