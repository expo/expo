// Copyright 2016-present 650 Industries. All rights reserved.

#import <GoogleSignIn/GIDSignIn.h>
#import <ABI45_0_0EXGoogleSignIn/ABI45_0_0EXGoogleSignInAppDelegate.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

@implementation ABI45_0_0EXGoogleSignInAppDelegate

ABI45_0_0EX_REGISTER_SINGLETON_MODULE(ABI45_0_0EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[GIDSignIn sharedInstance] handleURL:url];
}

@end
