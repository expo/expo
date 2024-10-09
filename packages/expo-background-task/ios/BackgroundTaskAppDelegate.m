// Copyright 2018-present 650 Industries. All rights reserved.

#import <BackgroundTaskAppDelegate.h>
#import <BackgroundTasks/BackgroundTasks.h>
#import <ExpoModulesCore/EXDefines.h>

#import <ExpoBackgroundTask-Swift.h>

@implementation BackgroundTaskAppDelegate

EX_REGISTER_SINGLETON_MODULE(BackgroundTaskAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  // MARK: Registering Launch Handlers for Tasks
  [BackgroundTaskModule registerHandler];
  
  return NO;
}

@end
