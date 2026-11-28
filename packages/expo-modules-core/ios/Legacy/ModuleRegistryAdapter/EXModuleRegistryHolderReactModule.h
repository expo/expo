// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistry.h>

@interface EXModuleRegistryHolderReactModule : NSObject

- (nonnull instancetype)initWithModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry;
- (nullable EXModuleRegistry *)exModuleRegistry;

@end
