/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI39_0_0React/ABI39_0_0RCTBridgeMethod.h>
#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>
#import <ABI39_0_0React/ABI39_0_0RCTNullability.h>

@class ABI39_0_0RCTBridge;

@interface ABI39_0_0RCTMethodArgument : NSObject

@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, readonly) ABI39_0_0RCTNullability nullability;
@property (nonatomic, readonly) BOOL unused;

@end

@interface ABI39_0_0RCTModuleMethod : NSObject <ABI39_0_0RCTBridgeMethod>

@property (nonatomic, readonly) Class moduleClass;
@property (nonatomic, readonly) SEL selector;

- (instancetype)initWithExportedMethod:(const ABI39_0_0RCTMethodInfo *)exportMethod
                           moduleClass:(Class)moduleClass NS_DESIGNATED_INITIALIZER;

@end

ABI39_0_0RCT_EXTERN NSString *ABI39_0_0RCTParseMethodSignature(const char *input, NSArray<ABI39_0_0RCTMethodArgument *> **arguments);
