// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI47_0_0EXScopedNotificationSchedulerModule.h"
#import "ABI47_0_0EXScopedNotificationsUtils.h"
#import "ABI47_0_0EXScopedNotificationSerializer.h"
#import "ABI47_0_0EXScopedNotificationsUtils.h"

@interface ABI47_0_0EXScopedNotificationSchedulerModule ()

@property (nonatomic, strong) NSString *scopeKey;

@end

@implementation ABI47_0_0EXScopedNotificationSchedulerModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }

  return self;
}

- (UNNotificationRequest *)buildNotificationRequestWithIdentifier:(NSString *)identifier
                                                          content:(NSDictionary *)contentInput
                                                          trigger:(NSDictionary *)triggerInput
{
  NSString *scopedIdentifier = [ABI47_0_0EXScopedNotificationsUtils scopedIdentifierFromId:identifier
                                                                    forExperience:_scopeKey];
  return [super buildNotificationRequestWithIdentifier:scopedIdentifier content:contentInput trigger:triggerInput];
}

- (NSArray * _Nonnull)serializeNotificationRequests:(NSArray<UNNotificationRequest *> * _Nonnull) requests;
{
  NSMutableArray *serializedRequests = [NSMutableArray new];
  for (UNNotificationRequest *request in requests) {
    if ([ABI47_0_0EXScopedNotificationsUtils isId:request.identifier scopedByExperience:_scopeKey]) {
      [serializedRequests addObject:[ABI47_0_0EXScopedNotificationSerializer serializedNotificationRequest:request]];
    }
  }
  return serializedRequests;
}


- (void)cancelNotification:(NSString *)identifier resolve:(ABI47_0_0EXPromiseResolveBlock)resolve rejecting:(ABI47_0_0EXPromiseRejectBlock)reject
{
  NSString *scopedIdentifier = [ABI47_0_0EXScopedNotificationsUtils scopedIdentifierFromId:identifier
                                                                    forExperience:_scopeKey];
  [super cancelNotification:scopedIdentifier resolve:resolve rejecting:reject];
}

- (void)cancelAllNotificationsWithResolver:(ABI47_0_0EXPromiseResolveBlock)resolve rejecting:(ABI47_0_0EXPromiseRejectBlock)reject
{
  __block NSString *scopeKey = _scopeKey;
  [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    NSMutableArray<NSString *> *toRemove = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      if ([ABI47_0_0EXScopedNotificationsUtils isId:request.identifier scopedByExperience:scopeKey]) {
        [toRemove addObject:request.identifier];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:toRemove];
    resolve(nil);
  }];
}

@end
