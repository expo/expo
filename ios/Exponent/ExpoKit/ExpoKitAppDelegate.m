// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryProvider.h>

#import "ExpoKitAppDelegate.h"
#import "ExpoKit.h"
#import "EXViewController.h"

@implementation ExpoKitAppDelegate

EX_REGISTER_SINGLETON_MODULE(ExpoKitAppDelegate)

- (const NSInteger)priority
{
  return -1;
}

#pragma mark - Handling URLs

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  id annotation = options[UIApplicationOpenURLOptionsAnnotationKey];
  NSString *sourceApplication = options[UIApplicationOpenURLOptionsSourceApplicationKey];
  
  return [[ExpoKit sharedInstance] application:app openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [[ExpoKit sharedInstance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

@end
