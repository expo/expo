// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge+Private.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXDevLauncherRCTCxxBridge : RCTCxxBridge

- (NSArray<Class> *)filterModuleList:(NSArray<Class> *)modules;

@end

@interface EXDevLauncherRCTBridge : RCTBridge

- (Class)bridgeClass;

@end

NS_ASSUME_NONNULL_END
