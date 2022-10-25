/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTBridgeModule.h"

@class ABI47_0_0RCTBundleManager;
@class ABI47_0_0RCTCallableJSModules;
@class ABI47_0_0RCTModuleRegistry;
@class ABI47_0_0RCTViewRegistry;

/**
 ABI47_0_0RCTBridgeModuleDecorator contains instances that can be intialized with @synthesize
 in ABI47_0_0RCTBridgeModules. For the Fabric interop layer.

 In Bridgeless, @synthesize ivars are passed from ABI47_0_0RCTBridgeModuleDecorator.
 In Bridge, @synthesize ivars are passed from ABI47_0_0RCTModuleData.
 */
@interface ABI47_0_0RCTBridgeModuleDecorator : NSObject
@property (nonatomic, strong, readonly) ABI47_0_0RCTViewRegistry *viewRegistry_DEPRECATED;
@property (nonatomic, strong, readonly) ABI47_0_0RCTModuleRegistry *moduleRegistry;
@property (nonatomic, strong, readonly) ABI47_0_0RCTBundleManager *bundleManager;
@property (nonatomic, strong, readonly) ABI47_0_0RCTCallableJSModules *callableJSModules;

- (instancetype)initWithViewRegistry:(ABI47_0_0RCTViewRegistry *)viewRegistry
                      moduleRegistry:(ABI47_0_0RCTModuleRegistry *)moduleRegistry
                       bundleManager:(ABI47_0_0RCTBundleManager *)bundleManager
                   callableJSModules:(ABI47_0_0RCTCallableJSModules *)callableJSModules;

- (void)attachInteropAPIsToModule:(id<ABI47_0_0RCTBridgeModule>)bridgeModule;

@end
