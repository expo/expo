// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistry.h>

/**
 The protocol required for the Objective-C views to be initialized with the legacy module registry.
 - ToDo: Remove once all views are migrated to the new API and Swift.
 */
@protocol EXLegacyExpoViewProtocol

- (instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry;

@end
