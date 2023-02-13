// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI48_0_0EXScopedNotificationPresentationModule.h"
#import "ABI48_0_0EXScopedNotificationsUtils.h"
#import "ABI48_0_0EXScopedNotificationSerializer.h"
#import "ABI48_0_0EXScopedNotificationsUtils.h"

@interface ABI48_0_0EXScopedNotificationPresentationModule ()

@property (nonatomic, strong) NSString *scopeKey;

@end

@implementation ABI48_0_0EXScopedNotificationPresentationModule

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  
  return self;
}

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications
{
  NSMutableArray *serializedNotifications = [NSMutableArray new];
  for (UNNotification *notification in notifications) {
    if ([ABI48_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_scopeKey]) {
      [serializedNotifications addObject:[ABI48_0_0EXScopedNotificationSerializer serializedNotification:notification]];
    }
  }
  return serializedNotifications;
}

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(ABI48_0_0EXPromiseResolveBlock)resolve reject:(ABI48_0_0EXPromiseRejectBlock)reject
{
  __block NSString *scopeKey = _scopeKey;
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    for (UNNotification *notification in notifications) {
      if ([ABI48_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:scopeKey]) {
        // Usually we would scope the input ID and then check equality, but remote notifications do not
        // have the scoping prefix, so instead let's remove the scope if there is one, then check for
        // equality against the input
        NSString *unscopedIdentifier = [ABI48_0_0EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:notification.request.identifier].identifier;
        if ([unscopedIdentifier isEqualToString:identifier]) {
          [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[notification.request.identifier]];
        }
        break;
      }
    }
    resolve(nil);
  }];
}

- (void)dismissAllNotificationsWithResolver:(ABI48_0_0EXPromiseResolveBlock)resolve reject:(ABI48_0_0EXPromiseRejectBlock)reject
{
  __block NSString *scopeKey = _scopeKey;
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    NSMutableArray<NSString *> *toDismiss = [NSMutableArray new];
    for (UNNotification *notification in notifications) {
      if ([ABI48_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:scopeKey]) {
        [toDismiss addObject:notification.request.identifier];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:toDismiss];
    resolve(nil);
  }];
}

@end
