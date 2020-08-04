// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI38_0_0EXScopedNotificationPresentationModule.h"
#import "ABI38_0_0EXScopedNotificationsUtils.h"

#import <ABI38_0_0EXNotifications/ABI38_0_0EXNotificationSerializer.h>

@interface ABI38_0_0EXScopedNotificationPresentationModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI38_0_0EXScopedNotificationPresentationModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  
  return self;
}

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications
{
  NSMutableArray *serializedNotifications = [NSMutableArray new];
  for (UNNotification *notification in notifications) {
    if ([ABI38_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
      [serializedNotifications addObject:[ABI38_0_0EXNotificationSerializer serializedNotification:notification]];
    }
  }
  return serializedNotifications;
}

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI38_0_0UMPromiseResolveBlock)resolve reject:(ABI38_0_0UMPromiseRejectBlock)reject
{
  __block NSString *experienceId = _experienceId;
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    for (UNNotification *notification in notifications) {
      if ([notification.request.identifier isEqual:identifier]) {
        if ([ABI38_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:experienceId]) {
          [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[identifier]];
        }
        break;
      }
    }
    resolve(nil);
  }];
}

- (void)dismissAllNotificationsWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve reject:(ABI38_0_0UMPromiseRejectBlock)reject
{
  __block NSString *experienceId = _experienceId;
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    NSMutableArray<NSString *> *toDismiss = [NSMutableArray new];
    for (UNNotification *notification in notifications) {
      if ([ABI38_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:experienceId]) {
        [toDismiss addObject:notification.request.identifier];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:toDismiss];
    resolve(nil);
  }];
}

@end
