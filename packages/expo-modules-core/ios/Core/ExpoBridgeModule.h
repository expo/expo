// Copyright 2024-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <ExpoModulesCore/EXNativeModulesProxy.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

@class EXAppContext;

@interface ExpoBridgeModule : NSObject <RCTBridgeModule>

@property (nonatomic, nullable, strong) EXAppContext *appContext;

- (nonnull instancetype)initWithAppContext:(nonnull EXAppContext *) appContext; 

- (void)legacyProxyDidSetBridge:(nonnull EXNativeModulesProxy *)moduleProxy
           legacyModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry;

@end
