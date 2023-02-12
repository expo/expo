/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTBridgeModule.h"

@class ABI48_0_0RCTBundleManager;
@class ABI48_0_0RCTCallableJSModules;
@class ABI48_0_0RCTModuleRegistry;
@class ABI48_0_0RCTViewRegistry;

/**
 ABI48_0_0RCTBridgeModuleDecorator contains instances that can be intialized with @synthesize
 in ABI48_0_0RCTBridgeModules. For the Fabric interop layer.

 In Bridgeless, @synthesize ivars are passed from ABI48_0_0RCTBridgeModuleDecorator.
 In Bridge, @synthesize ivars are passed from ABI48_0_0RCTModuleData.
 */
@interface ABI48_0_0RCTBridgeModuleDecorator : NSObject
@property (nonatomic, strong, readonly) ABI48_0_0RCTViewRegistry *viewRegistry_DEPRECATED;
@property (nonatomic, strong, readonly) ABI48_0_0RCTModuleRegistry *moduleRegistry;
@property (nonatomic, strong, readonly) ABI48_0_0RCTBundleManager *bundleManager;
@property (nonatomic, strong, readonly) ABI48_0_0RCTCallableJSModules *callableJSModules;

- (instancetype)initWithViewRegistry:(ABI48_0_0RCTViewRegistry *)viewRegistry
                      moduleRegistry:(ABI48_0_0RCTModuleRegistry *)moduleRegistry
                       bundleManager:(ABI48_0_0RCTBundleManager *)bundleManager
                   callableJSModules:(ABI48_0_0RCTCallableJSModules *)callableJSModules;

- (void)attachInteropAPIsToModule:(id<ABI48_0_0RCTBridgeModule>)bridgeModule;

@end
