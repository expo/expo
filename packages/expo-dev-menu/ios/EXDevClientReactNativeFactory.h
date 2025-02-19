// Copyright 2015-present 650 Industries. All rights reserved.

#ifndef EXDevClientReactNativeFactory_h
#define EXDevClientReactNativeFactory_h

#import <ExpoModulesCore/EXReactNativeFactory.h>

@interface EXDevClientReactNativeFactory : EXReactNativeFactory

// TODO vonovak move into a category / extension
- (NSURL *)bundleURL;
- (BOOL)fabricEnabled;
- (BOOL)turboModuleEnabled;
- (BOOL)bridgelessEnabled;

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps;

@end
#endif /* EXDevClientReactNativeFactory_h */

