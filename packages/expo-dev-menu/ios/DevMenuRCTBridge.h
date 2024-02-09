// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge+Private.h>

#import <EXDevMenu/DevClientAppDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface DevMenuRCTCxxBridge : RCTCxxBridge

- (NSArray<Class> *)filterModuleList:(NSArray<Class> *)modules;

@end

@interface DevMenuRCTBridge : RCTBridge

- (Class)bridgeClass;

@end

@interface DevMenuRCTAppDelegate : DevClientAppDelegate

@end

NS_ASSUME_NONNULL_END
