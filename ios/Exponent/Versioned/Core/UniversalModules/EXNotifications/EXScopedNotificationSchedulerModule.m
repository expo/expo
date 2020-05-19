// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationSchedulerModule.h"
#import "EXScopedNotificationsUtils.h"

#import <EXNotifications/EXNotificationSerializer.h>

@interface EXScopedNotificationSchedulerModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXScopedNotificationSchedulerModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }

  return self;
}

-(NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;
{
  NSMutableArray *serializedRequests = [NSMutableArray new];
  for (UNNotificationRequest *request in requests) {
    if ([EXScopedNotificationsUtils shouldNotificationRequest:request beHandledByExperience:_experienceId]) {
      [serializedRequests addObject:[EXNotificationSerializer serializedNotificationRequest:request]];
    }
  }
  return serializedRequests;
}

-(void)cancelScheduledNotificationAsync:(NSString * _Nonnull)identifier resolve:(UMPromiseResolveBlock _Nonnull)resolve rejecting:(UMPromiseRejectBlock _Nonnull)reject
{
  UM_WEAKIFY(self)
  [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    UM_ENSURE_STRONGIFY(self)
    for (UNNotificationRequest *request in requests) {
      if ([request.identifier isEqual:identifier]) {
        if ([EXScopedNotificationsUtils shouldNotificationRequest:request beHandledByExperience:self.experienceId]) {
          [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:@[identifier]];
        }
        break;
      }
    }
    resolve(nil);
  }];
}

-(void)cancelAllScheduledNotificationsAsync:(UMPromiseResolveBlock _Nonnull)resolve rejecting:(UMPromiseRejectBlock _Nonnull)reject
{
  UM_WEAKIFY(self)
  [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    UM_ENSURE_STRONGIFY(self)
    NSMutableArray<NSString *> *toRemove = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      if ([EXScopedNotificationsUtils shouldNotificationRequest:request beHandledByExperience:self.experienceId]) {
        [toRemove addObject:request.identifier];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:toRemove];
    resolve(nil);
  }];
}

@end
