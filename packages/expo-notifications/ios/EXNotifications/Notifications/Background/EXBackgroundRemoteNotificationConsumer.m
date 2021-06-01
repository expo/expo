// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXNotifications/EXBackgroundNotificationTasksModule.h>
#import <EXNotifications/EXBackgroundRemoteNotificationConsumer.h>
#import <UMTaskManagerInterface/UMTaskInterface.h>

@implementation EXBackgroundRemoteNotificationConsumer

+ (BOOL)supportsLaunchReason:(UMTaskLaunchReason)launchReason
{
  return launchReason == UMTaskLaunchReasonRemoteNotification;
}

- (NSString *)taskType
{
  return @"remote-notification";
}

// Associating task to the consumer.
- (void)didRegisterTask:(id<UMTaskInterface>)task
{
  _task = task;
}

// Method that is being called when the JS app just finished launching,
// after the native app was launched with the launch reason supported by the consumer.
// For background notifications, `application:didReceiveRemoteNotification:fetchCompletionHandler:` is the entry point of this method,
// so the task can be executed immediately here.
- (void)didBecomeReadyToExecuteWithData:(NSDictionary *)data
{
  [_task executeWithData:[self serializeTaskData:data] withError:nil];
}

// Translate result received from JS to another (native) type that is then used for example as an argument in completion callbacks.
- (NSUInteger)normalizeTaskResult:(id)result
{
  if (!result || result == [NSNull null]) {
    return UIBackgroundFetchResultNoData;
  }
  switch ([result unsignedIntegerValue]) {
    case EXBackgroundNotificationResultNewData:
      return UIBackgroundFetchResultNewData;
    case EXBackgroundNotificationResultFailed:
      return UIBackgroundFetchResultFailed;
    case EXBackgroundNotificationResultNoData:
    default:
      return UIBackgroundFetchResultNoData;
  }
}

- (NSDictionary *)serializeTaskData:(NSDictionary *)data
{
  return [data objectForKey:@"data"] ?: @{};
}

@end
