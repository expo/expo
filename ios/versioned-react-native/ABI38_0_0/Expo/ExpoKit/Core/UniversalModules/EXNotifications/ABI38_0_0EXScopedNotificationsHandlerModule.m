// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI38_0_0EXScopedNotificationsHandlerModule.h"
#import "ABI38_0_0EXScopedNotificationsUtils.h"

@interface ABI38_0_0EXScopedNotificationsHandlerModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI38_0_0EXScopedNotificationsHandlerModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  
  return self;
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([ABI38_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
  }
}

@end
