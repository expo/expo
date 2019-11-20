// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMAppDelegateWrapper.h>
#import <ABI36_0_0EXGoogleSignIn/ABI36_0_0EXGoogleSignInAppDelegate.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

@implementation ABI36_0_0EXGoogleSignInAppDelegate

ABI36_0_0UM_REGISTER_SINGLETON_MODULE(ABI36_0_0EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[GIDSignIn sharedInstance] handleURL:url];
}

@end
