// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXBackgroundFetch/ABI47_0_0EXBackgroundFetch.h>
#import <ABI47_0_0EXBackgroundFetch/ABI47_0_0EXBackgroundFetchTaskConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXTaskInterface.h>

@implementation ABI47_0_0EXBackgroundFetchTaskConsumer

+ (BOOL)supportsLaunchReason:(ABI47_0_0EXTaskLaunchReason)launchReason
{
  return launchReason == ABI47_0_0EXTaskLaunchReasonBackgroundFetch;
}

- (NSString *)taskType
{
  return @"backgroundFetch";
}

// Associating task to the consumer.
- (void)didRegisterTask:(id<ABI47_0_0EXTaskInterface>)task
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
- (void)didBecomeReadyToExecuteWithData:(NSDictionary *)data
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
    case ABI47_0_0EXBackgroundFetchResultNewData:
      return UIBackgroundFetchResultNewData;
    case ABI47_0_0EXBackgroundFetchResultFailed:
      return UIBackgroundFetchResultFailed;
    case ABI47_0_0EXBackgroundFetchResultNoData:
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
