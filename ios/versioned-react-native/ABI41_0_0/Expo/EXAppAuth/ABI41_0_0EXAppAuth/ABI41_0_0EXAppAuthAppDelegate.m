// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXAppAuth/ABI41_0_0EXAppAuthAppDelegate.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppDelegateWrapper.h>
#import <ABI41_0_0EXAppAuth/ABI41_0_0EXAppAuthSessionsManager.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryProvider.h>

@implementation ABI41_0_0EXAppAuthAppDelegate

ABI41_0_0UM_REGISTER_SINGLETON_MODULE(ABI41_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI41_0_0EXAppAuthSessionsManager *)[ABI41_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI41_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
