/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI23_0_0/ABI23_0_0RCTBridgeMethod.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>
#import <ReactABI23_0_0/ABI23_0_0RCTNullability.h>

@class ABI23_0_0RCTBridge;

@interface ABI23_0_0RCTMethodArgument : NSObject

@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, readonly) ABI23_0_0RCTNullability nullability;
@property (nonatomic, readonly) BOOL unused;

@end

@interface ABI23_0_0RCTModuleMethod : NSObject <ABI23_0_0RCTBridgeMethod>

@property (nonatomic, readonly) Class moduleClass;
@property (nonatomic, readonly) SEL selector;

- (instancetype)initWithExportedMethod:(const ABI23_0_0RCTMethodInfo *)exportMethod
                           moduleClass:(Class)moduleClass NS_DESIGNATED_INITIALIZER;

@end
