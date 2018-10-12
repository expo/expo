// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXBackgroundFetch/EXBackgroundFetchConstants.h>
#import <EXBackgroundFetch/EXBackgroundFetchTaskConsumer.h>
#import <EXTaskManagerInterface/EXTaskInterface.h>

@implementation EXBackgroundFetchTaskConsumer

+ (BOOL)supportsLaunchReason:(EXTaskLaunchReason)launchReason
{
  return launchReason == EXTaskLaunchReasonBackgroundFetch;
}

// Associating task to the consumer.
- (void)didRegisterTask:(id<EXTaskInterface>)task
{
  _task = task;
}

// Method that is being called when the JS app just finished launching,
// after the native app was launched with the launch reason supported by the consumer.
// For background fetch, `application:performFetchWithCompletionHandler:` is the entry point of this method,
// so the task can be executed immediately here.
- (void)didBecomeReadyToExecute
{
  [_task executeWithData:nil withError:nil];
}

// Translate result received from JS to another (native) type that is then used for example as an argument in completion callbacks.
- (NSNumber *)normalizeTaskResult:(NSString *)result
{
  if ([result isEqualToString:EXBackgroundFetchResultFailed]) {
    return @(UIBackgroundFetchResultFailed);
  }
  if ([result isEqualToString:EXBackgroundFetchResultNewData]) {
    return @(UIBackgroundFetchResultNewData);
  }
  return @(UIBackgroundFetchResultNoData);
}

@end
