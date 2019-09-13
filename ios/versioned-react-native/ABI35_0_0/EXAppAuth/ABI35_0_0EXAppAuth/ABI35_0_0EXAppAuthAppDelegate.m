// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXAppAuth/ABI35_0_0EXAppAuthAppDelegate.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMAppDelegateWrapper.h>
#import <ABI35_0_0EXAppAuth/ABI35_0_0EXAppAuthSessionsManager.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryProvider.h>

@implementation ABI35_0_0EXAppAuthAppDelegate

ABI35_0_0UM_REGISTER_SINGLETON_MODULE(ABI35_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI35_0_0EXAppAuthSessionsManager *)[ABI35_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI35_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
