// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationPresentationModule.h"
#import "EXScopedNotificationsUtils.h"
#import "EXScopedNotificationSerializer.h"
#import "EXScopedNotificationsUtils.h"

@interface EXScopedNotificationPresentationModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXScopedNotificationPresentationModule

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
    if ([EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
      [serializedNotifications addObject:[EXScopedNotificationSerializer serializedNotification:notification]];
    }
  }
  return serializedNotifications;
}

- (void)dismissNotificationWithIdentifier:(NSString *)identifier resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject
{
  __block NSString *experienceId = _experienceId;
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    for (UNNotification *notification in notifications) {
      if ([EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:experienceId]) {
        // Usually we would scope the input ID and then check equality, but remote notifications do not
        // have the scoping prefix, so instead let's remove the scope if there is one, then check for
        // equality against the input
        NSString *unscopedIdentifier = [EXScopedNotificationsUtils getScopeAndIdentifierFromScopedIdentifier:notification.request.identifier].identifier;
        if ([unscopedIdentifier isEqualToString:identifier]) {
          [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[notification.request.identifier]];
        }
        break;
      }
    }
    resolve(nil);
  }];
}

- (void)dismissAllNotificationsWithResolver:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject
{
  __block NSString *experienceId = _experienceId;
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    NSMutableArray<NSString *> *toDismiss = [NSMutableArray new];
    for (UNNotification *notification in notifications) {
      if ([EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:experienceId]) {
        [toDismiss addObject:notification.request.identifier];
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:toDismiss];
    resolve(nil);
  }];
}

@end
