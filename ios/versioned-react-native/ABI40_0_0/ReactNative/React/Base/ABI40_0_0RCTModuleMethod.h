/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI40_0_0React/ABI40_0_0RCTBridgeMethod.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>
#import <ABI40_0_0React/ABI40_0_0RCTNullability.h>

@class ABI40_0_0RCTBridge;

@interface ABI40_0_0RCTMethodArgument : NSObject

@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, readonly) ABI40_0_0RCTNullability nullability;
@property (nonatomic, readonly) BOOL unused;

@end

@interface ABI40_0_0RCTModuleMethod : NSObject <ABI40_0_0RCTBridgeMethod>

@property (nonatomic, readonly) Class moduleClass;
@property (nonatomic, readonly) SEL selector;

- (instancetype)initWithExportedMethod:(const ABI40_0_0RCTMethodInfo *)exportMethod
                           moduleClass:(Class)moduleClass NS_DESIGNATED_INITIALIZER;

@end

ABI40_0_0RCT_EXTERN NSString *ABI40_0_0RCTParseMethodSignature(const char *input, NSArray<ABI40_0_0RCTMethodArgument *> **arguments);
