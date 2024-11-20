// Copyright 2024-present 650 Industries. All rights reserved.

#import <BackgroundTaskAppDelegate.h>
#import <BackgroundTasks/BackgroundTasks.h>
#import <ExpoModulesCore/EXDefines.h>

#import <ExpoBackgroundTask-Swift.h>

@implementation BackgroundTaskAppDelegate

EX_REGISTER_SINGLETON_MODULE(BackgroundTaskAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  // MARK: Registering Launch Handlers for Tasks
  if ([BackgroundTaskService supportsBackgroundTasks] == YES) {
    if ([BackgroundTaskService register] == NO) {
      EXFatal(EXErrorWithMessage(@"It was not possible to register and set up the BGTaskScheduler handler.\n"
                                 "On iOS your plist.info file should contain the following information:\n"
                                 "<key>BGTaskSchedulerPermittedIdentifiers</key>\n"
                                 "<array><string>com.expo.modules.backgroundtask.processing</string></array>\n\n"
                                 "This should've been set up when installing the module, but seems to be missing."));
    }
  }
  
  return YES;
}

@end
