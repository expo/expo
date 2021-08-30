// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuthAppDelegate.h>
#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <EXAppAuth/EXAppAuthSessionsManager.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>

@implementation EXAppAuthAppDelegate

EX_REGISTER_SINGLETON_MODULE(EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(EXAppAuthSessionsManager *)[EXModuleRegistryProvider getSingletonModuleForClass:EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
