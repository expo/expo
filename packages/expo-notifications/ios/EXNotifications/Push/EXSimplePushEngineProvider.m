// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXBareEngine.h>
#import <EXNotifications/EXEngine.h>
#import <EXNotifications/EXExpoEngine.h>
#import <EXNotifications/EXSimplePushEngineProvider.h>

@implementation EXSimplePushEngineProvider

static id<EXEngine> engine = nil;
static NSLock* lock;

+ (id)getEngine {
  [lock lock];
  if (engine == nil) {
    NSString* engineType = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"EXNotificationsPushEngine"];
    if (!engineType) {
      engine = [EXBareEngine new];
      if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"EXNotificationsAppId"]) {
        engine = [EXExpoEngine new];
      }
    } else {
      if ([engineType isEqualToString:@"bare"]) {
        engine = [EXBareEngine new];
      } else {
        engine = [EXExpoEngine new];
      }
    }
  }
  [lock unlock];
  return engine;
}

@end
