/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTBridgeModule.h"

@class ABI46_0_0RCTBundleManager;
@class ABI46_0_0RCTCallableJSModules;
@class ABI46_0_0RCTModuleRegistry;
@class ABI46_0_0RCTViewRegistry;

/**
 ABI46_0_0RCTBridgeModuleDecorator contains instances that can be intialized with @synthesize
 in ABI46_0_0RCTBridgeModules. For the Fabric interop layer.

 In Bridgeless, @synthesize ivars are passed from ABI46_0_0RCTBridgeModuleDecorator.
 In Bridge, @synthesize ivars are passed from ABI46_0_0RCTModuleData.
 */
@interface ABI46_0_0RCTBridgeModuleDecorator : NSObject
@property (nonatomic, strong, readonly) ABI46_0_0RCTViewRegistry *viewRegistry_DEPRECATED;
@property (nonatomic, strong, readonly) ABI46_0_0RCTModuleRegistry *moduleRegistry;
@property (nonatomic, strong, readonly) ABI46_0_0RCTBundleManager *bundleManager;
@property (nonatomic, strong, readonly) ABI46_0_0RCTCallableJSModules *callableJSModules;

- (instancetype)initWithViewRegistry:(ABI46_0_0RCTViewRegistry *)viewRegistry
                      moduleRegistry:(ABI46_0_0RCTModuleRegistry *)moduleRegistry
                       bundleManager:(ABI46_0_0RCTBundleManager *)bundleManager
                   callableJSModules:(ABI46_0_0RCTCallableJSModules *)callableJSModules;

- (void)attachInteropAPIsToModule:(id<ABI46_0_0RCTBridgeModule>)bridgeModule;

@end
