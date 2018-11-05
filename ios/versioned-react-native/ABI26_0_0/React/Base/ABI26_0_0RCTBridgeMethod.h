/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class ABI26_0_0RCTBridge;

typedef NS_ENUM(NSUInteger, ABI26_0_0RCTFunctionType) {
  ABI26_0_0RCTFunctionTypeNormal,
  ABI26_0_0RCTFunctionTypePromise,
  ABI26_0_0RCTFunctionTypeSync,
};

static inline const char *ABI26_0_0RCTFunctionDescriptorFromType(ABI26_0_0RCTFunctionType type) {
  switch (type) {
    case ABI26_0_0RCTFunctionTypeNormal:
      return "async";
    case ABI26_0_0RCTFunctionTypePromise:
      return "promise";
    case ABI26_0_0RCTFunctionTypeSync:
      return "sync";
  }
};

@protocol ABI26_0_0RCTBridgeMethod <NSObject>

@property (nonatomic, readonly) const char *JSMethodName;
@property (nonatomic, readonly) ABI26_0_0RCTFunctionType functionType;

- (id)invokeWithBridge:(ABI26_0_0RCTBridge *)bridge
                module:(id)module
             arguments:(NSArray *)arguments;

@end
