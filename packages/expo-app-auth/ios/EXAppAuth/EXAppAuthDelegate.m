// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuthDelegate.h>
#import <UMCore/UMAppDelegateWrapper.h>

@implementation EXAppAuthDelegate

UM_REGISTER_SINGLETON_MODULE(EXAppAuthDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[EXAppAuth instance] application:app openURL:url options:options];
}

@end
