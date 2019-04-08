// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMAppDelegateWrapper.h>
#import <EXGoogleSignIn/EXGoogleSignInDelegate.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@implementation EXGoogleSignInDelegate

UM_REGISTER_SINGLETON_MODULE(singleton_nameEXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  id annotation = options[UIApplicationOpenURLOptionsAnnotationKey];
  NSString *sourceApplication = options[UIApplicationOpenURLOptionsSourceApplicationKey];
  return [[GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation];
}

@end
