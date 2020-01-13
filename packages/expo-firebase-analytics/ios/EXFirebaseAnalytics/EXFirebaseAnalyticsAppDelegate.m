// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXFirebaseAnalytics/EXFirebaseAnalyticsAppDelegate.h>
#import <UMCore/UMAppDelegateWrapper.h>
#import <Firebase/Firebase.h>
#import <UMCore/UMDefines.h>

@implementation EXFirebaseAnalyticsAppDelegate

UM_REGISTER_SINGLETON_MODULE(EXFirebaseAnalyticsAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  if ([FIROptions defaultOptions] != nil && [FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }
  return NO;
}

@end
