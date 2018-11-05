/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTBridgeMethod.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>
#import <ReactABI29_0_0/ABI29_0_0RCTNullability.h>

@class ABI29_0_0RCTBridge;

@interface ABI29_0_0RCTMethodArgument : NSObject

@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, readonly) ABI29_0_0RCTNullability nullability;
@property (nonatomic, readonly) BOOL unused;

@end

@interface ABI29_0_0RCTModuleMethod : NSObject <ABI29_0_0RCTBridgeMethod>

@property (nonatomic, readonly) Class moduleClass;
@property (nonatomic, readonly) SEL selector;

- (instancetype)initWithExportedMethod:(const ABI29_0_0RCTMethodInfo *)exportMethod
                           moduleClass:(Class)moduleClass NS_DESIGNATED_INITIALIZER;

@end
