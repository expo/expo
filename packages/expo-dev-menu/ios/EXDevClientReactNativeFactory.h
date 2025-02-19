//
//  EXDevClientReactNativeFactory.h
//  Pods
//
//  Created by Vojtech Novak on 14.02.2025.
//

#ifndef EXDevClientReactNativeFactory_h
#define EXDevClientReactNativeFactory_h

#import <ExpoModulesCore/EXReactNativeFactory.h>

@interface EXDevClientReactNativeFactory : EXReactNativeFactory

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

