// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge+Private.h>

#import <EXDevMenu/DevClientReactNativeFactoryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTRootViewFactory ()

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge;

@end

@interface DevMenuRCTCxxBridge : RCTCxxBridge

- (NSArray<Class> *)filterModuleList:(NSArray<Class> *)modules;

@end

@interface DevMenuRCTBridge : RCTBridge

- (Class)bridgeClass;

@end

@interface DevMenuReactNativeFactoryDelegate : DevClientReactNativeFactoryDelegate

@end

NS_ASSUME_NONNULL_END
