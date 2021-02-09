// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXAppAuth/ABI39_0_0EXAppAuthAppDelegate.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppDelegateWrapper.h>
#import <ABI39_0_0EXAppAuth/ABI39_0_0EXAppAuthSessionsManager.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryProvider.h>

@implementation ABI39_0_0EXAppAuthAppDelegate

ABI39_0_0UM_REGISTER_SINGLETON_MODULE(ABI39_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI39_0_0EXAppAuthSessionsManager *)[ABI39_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI39_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
