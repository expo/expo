// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface DevMenuVendoredModulesUtils : NSObject

+ (NSArray<id<RCTBridgeModule>> *)vendoredModules:(RCTBridge *)bridge addReanimated2:(BOOL)addReanimated2;

@end

NS_ASSUME_NONNULL_END
