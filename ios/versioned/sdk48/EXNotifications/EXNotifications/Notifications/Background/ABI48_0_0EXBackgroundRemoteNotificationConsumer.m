// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXNotifications/ABI48_0_0EXBackgroundNotificationTasksModule.h>
#import <ABI48_0_0EXNotifications/ABI48_0_0EXBackgroundRemoteNotificationConsumer.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXTaskInterface.h>

@implementation ABI48_0_0EXBackgroundRemoteNotificationConsumer

+ (BOOL)supportsLaunchReason:(ABI48_0_0EXTaskLaunchReason)launchReason
{
  return launchReason == ABI48_0_0EXTaskLaunchReasonRemoteNotification;
}

- (NSString *)taskType
{
  return @"remote-notification";
}

// Associating task to the consumer.
- (void)didRegisterTask:(id<ABI48_0_0EXTaskInterface>)task
{
  _task = task;
}

// Method that is being called when the JS app just finished launching,
// after the native app was launched with the launch reason supported by the consumer.
// For background notifications, `application:didReceiveRemoteNotification:fetchCompletionHandler:` is the entry point of this method,
// so the task can be executed immediately here if the app is not foregrounded.
- (void)didBecomeReadyToExecuteWithData:(NSDictionary *)data
{
  if ([[UIApplication sharedApplication] applicationState] != UIApplicationStateActive) {
    [_task executeWithData:data withError:nil];
  }
}

// Translate result received from JS to another (native) type that is then used for example as an argument in completion callbacks.
- (NSUInteger)normalizeTaskResult:(id)result
{
  if (!result || result == [NSNull null]) {
    return UIBackgroundFetchResultNoData;
  }
  switch ([result unsignedIntegerValue]) {
    case ABI48_0_0EXBackgroundNotificationResultNewData:
      return UIBackgroundFetchResultNewData;
    case ABI48_0_0EXBackgroundNotificationResultFailed:
      return UIBackgroundFetchResultFailed;
    case ABI48_0_0EXBackgroundNotificationResultNoData:
    default:
      return UIBackgroundFetchResultNoData;
  }
}

@end
