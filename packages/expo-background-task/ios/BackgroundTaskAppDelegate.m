// Copyright 2024-present 650 Industries. All rights reserved.

#import <BackgroundTaskAppDelegate.h>
#import <BackgroundTasks/BackgroundTasks.h>
#import <ExpoModulesCore/EXDefines.h>

#import <EXTaskManager/EXTaskService.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>

#import <ExpoBackgroundTask-Swift.h>

@implementation BackgroundTaskAppDelegate

EX_REGISTER_SINGLETON_MODULE(BackgroundTaskAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  // MARK: Registering Launch Handlers for Tasks
  if ([BackgroundTaskScheduler supportsBackgroundTasks] == YES) {

    // Register with the BGTaskScheduler
    if ([[BGTaskScheduler sharedScheduler] registerForTaskWithIdentifier:BackgroundTaskConstants.BackgroundWorkerIdentifier usingQueue:nil launchHandler:^(__kindof BGTask * _Nonnull task) {

      NSLog(@"Expo Background Tasks - starting background work");
      
      __weak __typeof(task) weakTask = task;
      
      // Handle expiration
      task.expirationHandler = ^{
        __strong __typeof(weakTask) strongTask = weakTask;
        if (strongTask) {
          NSLog(@"Expo Background Tasks - task expired");
          [strongTask setTaskCompletedWithSuccess:NO];
        }
      };
      
      // Use a dispatch group to wait until tasks are completed
      dispatch_group_t taskGroup = dispatch_group_create();
      dispatch_group_enter(taskGroup);

      // Callback when the scheduler calls us
      [(EXTaskService *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXTaskService class]] runTasksWithReason:EXTaskLaunchReasonBackgroundTask userInfo:nil completionHandler: ^(UIBackgroundFetchResult res) {
        // We're done executing the task.
        NSLog(@"Expo Background Tasks - done running background work");
        dispatch_group_leave(taskGroup);
      }];
      
      dispatch_group_notify(taskGroup, dispatch_get_main_queue(), ^{
        [task setTaskCompletedWithSuccess:YES];
        NSLog(@"Expo Background Tasks - Task marked as completed successfully.");
      });

    }] == NO) {
      // Registration failed
      EXFatal(EXErrorWithMessage(@"It was not possible to register and set up the BGTaskScheduler handler.\n"
                                 "On iOS your plist.info file should contain the following information:\n"
                                 "<key>BGTaskSchedulerPermittedIdentifiers</key>\n"
                                 "<array><string>com.expo.modules.backgroundtask.processing</string></array>\n\n"
                                 "This should've been set up when installing the module, but seems to be missing."));
    }
    
    NSLog(@"Expo Background Tasks - Successfully registered background task handler with identifier %@", BackgroundTaskConstants.BackgroundWorkerIdentifier);
  }

  return YES;
}

@end
