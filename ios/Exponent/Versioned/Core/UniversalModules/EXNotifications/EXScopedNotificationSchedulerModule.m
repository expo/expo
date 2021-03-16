// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationSchedulerModule.h"
#import "EXScopedNotificationsUtils.h"
#import "EXScopedNotificationSerializer.h"
#import "EXScopedNotificationsUtils.h"

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

- (UNNotificationRequest *)buildNotificationRequestWithIdentifier:(NSString *)identifier
                                                          content:(NSDictionary *)contentInput
                                                          trigger:(NSDictionary *)triggerInput
{
  NSString *scopedIdentifier = [EXScopedNotificationsUtils scopedIdentifierFromId:identifier
                                                                    forExperience:_experienceId];
  return [super buildNotificationRequestWithIdentifier:scopedIdentifier content:contentInput trigger:triggerInput];
}

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;
{
  NSMutableArray *serializedRequests = [NSMutableArray new];
  for (UNNotificationRequest *request in requests) {
    if ([EXScopedNotificationsUtils isId:request.identifier scopedByExperience:_experienceId]) {
      [serializedRequests addObject:[EXScopedNotificationSerializer serializedNotificationRequest:request]];
    }
  }
  return serializedRequests;
}


- (void)cancelNotification:(NSString *)identifier resolve:(UMPromiseResolveBlock)resolve rejecting:(UMPromiseRejectBlock)reject
{
  NSString *scopedIdentifier = [EXScopedNotificationsUtils scopedIdentifierFromId:identifier
                                                                    forExperience:_experienceId];
  [super cancelNotification:scopedIdentifier resolve:resolve rejecting:reject];
}

- (void)cancelAllNotificationsWithResolver:(UMPromiseResolveBlock)resolve rejecting:(UMPromiseRejectBlock)reject
{
  __block NSString *experienceId = _experienceId;
  [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    NSMutableArray<NSString *> *toRemove = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      if ([EXScopedNotificationsUtils isId:request.identifier scopedByExperience:experienceId]) {
        [toRemove addObject:request.identifier];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:toRemove];
    resolve(nil);
  }];
}

@end
