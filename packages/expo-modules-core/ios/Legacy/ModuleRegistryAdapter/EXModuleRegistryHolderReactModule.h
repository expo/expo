// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<React/React-Core-umbrella.h>)
#import <React/React-Core-umbrella.h>
#else
#import <React_Core/React_Core-umbrella.h>
#endif

#import <ExpoModulesCore/EXModuleRegistry.h>

@interface EXModuleRegistryHolderReactModule : NSObject <RCTBridgeModule>

- (nonnull instancetype)initWithModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry;
- (nullable EXModuleRegistry *)exModuleRegistry;

@end
