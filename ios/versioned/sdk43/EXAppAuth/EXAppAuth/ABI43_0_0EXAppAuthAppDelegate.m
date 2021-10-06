// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXAppAuth/ABI43_0_0EXAppAuthAppDelegate.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppDelegateWrapper.h>
#import <ABI43_0_0EXAppAuth/ABI43_0_0EXAppAuthSessionsManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryProvider.h>

@implementation ABI43_0_0EXAppAuthAppDelegate

ABI43_0_0EX_REGISTER_SINGLETON_MODULE(ABI43_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI43_0_0EXAppAuthSessionsManager *)[ABI43_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI43_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
