// Copyright 2016-present 650 Industries. All rights reserved.

#import <GoogleSignIn/GIDSignIn.h>
#import <ABI44_0_0EXGoogleSignIn/ABI44_0_0EXGoogleSignInAppDelegate.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

@implementation ABI44_0_0EXGoogleSignInAppDelegate

ABI44_0_0EX_REGISTER_SINGLETON_MODULE(ABI44_0_0EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[GIDSignIn sharedInstance] handleURL:url];
}

@end
