// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXAppAuth/ABI44_0_0EXAppAuthAppDelegate.h>
#import <ABI44_0_0EXAppAuth/ABI44_0_0EXAppAuthSessionsManager.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryProvider.h>

@implementation ABI44_0_0EXAppAuthAppDelegate

ABI44_0_0EX_REGISTER_SINGLETON_MODULE(ABI44_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI44_0_0EXAppAuthSessionsManager *)[ABI44_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI44_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
