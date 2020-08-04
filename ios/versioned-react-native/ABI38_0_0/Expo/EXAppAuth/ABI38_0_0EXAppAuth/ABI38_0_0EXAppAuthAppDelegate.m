// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXAppAuth/ABI38_0_0EXAppAuthAppDelegate.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppDelegateWrapper.h>
#import <ABI38_0_0EXAppAuth/ABI38_0_0EXAppAuthSessionsManager.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryProvider.h>

@implementation ABI38_0_0EXAppAuthAppDelegate

ABI38_0_0UM_REGISTER_SINGLETON_MODULE(ABI38_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI38_0_0EXAppAuthSessionsManager *)[ABI38_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI38_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
