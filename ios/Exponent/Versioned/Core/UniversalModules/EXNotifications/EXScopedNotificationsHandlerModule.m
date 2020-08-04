// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationsHandlerModule.h"
#import "EXScopedNotificationsUtils.h"

@interface EXScopedNotificationsHandlerModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXScopedNotificationsHandlerModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  
  return self;
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
  }
}

@end
