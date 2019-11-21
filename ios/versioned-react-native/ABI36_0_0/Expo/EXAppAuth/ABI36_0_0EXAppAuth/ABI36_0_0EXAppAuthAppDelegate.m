// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXAppAuth/ABI36_0_0EXAppAuthAppDelegate.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMAppDelegateWrapper.h>
#import <ABI36_0_0EXAppAuth/ABI36_0_0EXAppAuthSessionsManager.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryProvider.h>

@implementation ABI36_0_0EXAppAuthAppDelegate

ABI36_0_0UM_REGISTER_SINGLETON_MODULE(ABI36_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI36_0_0EXAppAuthSessionsManager *)[ABI36_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI36_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
