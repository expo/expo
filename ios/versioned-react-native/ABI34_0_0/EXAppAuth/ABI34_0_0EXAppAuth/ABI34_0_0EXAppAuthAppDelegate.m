// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXAppAuth/ABI34_0_0EXAppAuthAppDelegate.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMAppDelegateWrapper.h>
#import <ABI34_0_0EXAppAuth/ABI34_0_0EXAppAuthSessionsManager.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryProvider.h>

@implementation ABI34_0_0EXAppAuthAppDelegate

ABI34_0_0UM_REGISTER_SINGLETON_MODULE(ABI34_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI34_0_0EXAppAuthSessionsManager *)[ABI34_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI34_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
