// Copyright 2024-present 650 Industries. All rights reserved.

#if __has_include(<React/React-Core-umbrella.h>)
#import <React/React-Core-umbrella.h>
#else
#import <React_Core/React_Core-umbrella.h>
#endif
#import <ExpoModulesCore/EXNativeModulesProxy.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

@class EXAppContext;

@interface ExpoBridgeModule : NSObject <RCTBridgeModule>

@property(nonatomic, nullable, strong) EXAppContext *appContext;

- (nonnull instancetype)initWithAppContext:(nonnull EXAppContext *)appContext;

- (void)legacyProxyDidSetBridge:(nonnull EXNativeModulesProxy *)moduleProxy
           legacyModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry;

@end
