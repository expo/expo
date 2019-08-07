// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMAppDelegateWrapper.h>
#import <ABI33_0_0EXGoogleSignIn/ABI33_0_0EXGoogleSignInAppDelegate.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

@implementation ABI33_0_0EXGoogleSignInAppDelegate

ABI33_0_0UM_REGISTER_SINGLETON_MODULE(ABI33_0_0EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  id annotation = options[UIApplicationOpenURLOptionsAnnotationKey];
  NSString *sourceApplication = options[UIApplicationOpenURLOptionsSourceApplicationKey];
  return [[GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation];
}

@end
