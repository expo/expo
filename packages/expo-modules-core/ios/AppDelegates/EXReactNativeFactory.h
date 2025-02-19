// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTReactNativeFactory.h"

NS_ASSUME_NONNULL_BEGIN

@interface RCTReactNativeFactory ()

- (NSURL *)bundleURL;
- (BOOL)fabricEnabled;
- (BOOL)turboModuleEnabled;
- (BOOL)bridgelessEnabled;

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps;


@end

@interface EXReactNativeFactory : RCTReactNativeFactory

@end

NS_ASSUME_NONNULL_END
