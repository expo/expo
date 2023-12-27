// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXAppAuth/ABI42_0_0EXAppAuthAppDelegate.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppDelegateWrapper.h>
#import <ABI42_0_0EXAppAuth/ABI42_0_0EXAppAuthSessionsManager.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryProvider.h>

@implementation ABI42_0_0EXAppAuthAppDelegate

ABI42_0_0UM_REGISTER_SINGLETON_MODULE(ABI42_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI42_0_0EXAppAuthSessionsManager *)[ABI42_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI42_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
