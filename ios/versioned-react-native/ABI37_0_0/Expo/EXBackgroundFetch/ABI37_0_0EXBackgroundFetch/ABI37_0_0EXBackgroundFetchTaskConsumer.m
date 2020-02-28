// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXBackgroundFetch/ABI37_0_0EXBackgroundFetch.h>
#import <ABI37_0_0EXBackgroundFetch/ABI37_0_0EXBackgroundFetchTaskConsumer.h>
#import <ABI37_0_0UMTaskManagerInterface/ABI37_0_0UMTaskInterface.h>

@implementation ABI37_0_0EXBackgroundFetchTaskConsumer

+ (BOOL)supportsLaunchReason:(ABI37_0_0UMTaskLaunchReason)launchReason
{
  return launchReason == ABI37_0_0UMTaskLaunchReasonBackgroundFetch;
}

- (NSString *)taskType
{
  return @"backgroundFetch";
}

// Associating task to the consumer.
- (void)didRegisterTask:(id<ABI37_0_0UMTaskInterface>)task
{
  _task = task;
  [self updateMinimumInterval];
}

- (void)setOptions:(NSDictionary *)options
{
  [self updateMinimumInterval];
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
- (NSUInteger)normalizeTaskResult:(id)result
{
  if (!result || result == [NSNull null]) {
    return UIBackgroundFetchResultNoData;
  }
  switch ([result unsignedIntegerValue]) {
    case ABI37_0_0EXBackgroundFetchResultNewData:
      return UIBackgroundFetchResultNewData;
    case ABI37_0_0EXBackgroundFetchResultFailed:
      return UIBackgroundFetchResultFailed;
    case ABI37_0_0EXBackgroundFetchResultNoData:
    default:
      return UIBackgroundFetchResultNoData;
  }
}

- (void)updateMinimumInterval
{
  NSNumber *interval = _task.options[@"minimumInterval"];
  NSTimeInterval timeInterval = [interval doubleValue] ?: UIApplicationBackgroundFetchIntervalMinimum;

  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:timeInterval];
  });
}

@end
