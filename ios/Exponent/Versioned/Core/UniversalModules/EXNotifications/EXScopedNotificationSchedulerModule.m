// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationSchedulerModule.h"
#import "EXScopedNotificationsUtils.h"

#import <EXNotifications/EXNotificationSerializer.h>

@interface EXScopedNotificationSchedulerModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

// TODO: (@lukmccall) experiences may break one another by trying to schedule notifications of the same identifier.
// See https://github.com/expo/expo/pull/8361#discussion_r429153429.
@implementation EXScopedNotificationSchedulerModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }

  return self;
}

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;
{
  NSMutableArray *serializedRequests = [NSMutableArray new];
  for (UNNotificationRequest *request in requests) {
    if ([EXScopedNotificationsUtils shouldNotificationRequest:request beHandledByExperience:_experienceId]) {
      [serializedRequests addObject:[EXNotificationSerializer serializedNotificationRequest:request]];
    }
  }
  return serializedRequests;
}

- (void)cancelNotification:(NSString *)identifier resolve:(UMPromiseResolveBlock)resolve rejecting:(UMPromiseRejectBlock)reject
{
  __block NSString *experienceId = _experienceId;
  [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    for (UNNotificationRequest *request in requests) {
      if ([request.identifier isEqual:identifier]) {
        if ([EXScopedNotificationsUtils shouldNotificationRequest:request beHandledByExperience:experienceId]) {
          [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:@[identifier]];
        }
        break;
      }
    }
    resolve(nil);
  }];
}

- (void)cancelAllNotificationsWithResolver:(UMPromiseResolveBlock)resolve rejecting:(UMPromiseRejectBlock)reject
{
  __block NSString *experienceId = _experienceId;
  [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    NSMutableArray<NSString *> *toRemove = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      if ([EXScopedNotificationsUtils shouldNotificationRequest:request beHandledByExperience:experienceId]) {
        [toRemove addObject:request.identifier];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:toRemove];
    resolve(nil);
  }];
}

@end
