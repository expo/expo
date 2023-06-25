// Copyright 2022-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistry.h>

/**
 The protocol required for the Objective-C views to be initialized with the legacy module registry.
 - ToDo: Remove once all views are migrated to the new API and Swift.
 */
@protocol ABI49_0_0EXLegacyExpoViewProtocol

- (instancetype)initWithModuleRegistry:(nullable ABI49_0_0EXModuleRegistry *)moduleRegistry;

@end
