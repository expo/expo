// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuthDelegate.h>
#import <UMCore/UMAppDelegateWrapper.h>

@implementation EXAppAuthDelegate

void UMRegisterSubcontractor(Class);

+ (void)load {
  UMRegisterSubcontractor([self sharedInstance]);
}

+ (id)sharedInstance {
  static EXAppAuthDelegate *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[EXAppAuth instance] application:app openURL:url options:options];
}

@end
