// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMAppDelegateWrapper.h>
#import <EXGoogleSignIn/EXGoogleSignInAppDelegate.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@implementation EXGoogleSignInAppDelegate

UM_REGISTER_SINGLETON_MODULE(EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  id annotation = options[UIApplicationOpenURLOptionsAnnotationKey];
  NSString *sourceApplication = options[UIApplicationOpenURLOptionsSourceApplicationKey];
  return [[GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation];
}

@end
