// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMAppDelegateWrapper.h>
#import <EXGoogleSignIn/EXGoogleSignInDelegate.h>

@implementation EXGoogleSignInDelegate

void UMRegisterSubcontractor(Class);

+ (void)load {
  UMRegisterSubcontractor([self sharedInstance]);
}

+ (id)sharedInstance {
  static EXGoogleSignInDelegate *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  id annotation = options[UIApplicationOpenURLOptionsAnnotationKey];
  NSString *sourceApplication = options[UIApplicationOpenURLOptionsSourceApplicationKey];
  return [[GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation];
}

@end
