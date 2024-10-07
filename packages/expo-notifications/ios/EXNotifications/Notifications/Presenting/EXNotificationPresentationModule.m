// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationPresentationModule.h>

#import <EXNotifications/EXNotificationBuilder.h>
#import <EXNotifications/EXNotificationSerializer.h>
#import <EXNotifications/EXNotificationCenterDelegate.h>

@interface EXNotificationPresentationModule ()

@property (nonatomic, weak) id<EXNotificationBuilder> notificationBuilder;

@end

@implementation EXNotificationPresentationModule

EX_EXPORT_MODULE(ExpoNotificationPresenter);

# pragma mark - Exported methods

EX_EXPORT_METHOD_AS(getPresentedNotificationsAsync,
                    getPresentedNotificationsAsyncWithResolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    resolve([self serializeNotifications:notifications]);
  }];
}


EX_EXPORT_METHOD_AS(dismissNotificationAsync,
                    dismissNotificationWithIdentifier:(NSString *)identifier
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[identifier]];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(dismissAllNotificationsAsync,
                    dismissAllNotificationsWithResolver:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
  resolve(nil);
}

# pragma mark - EXModuleRegistryConsumer

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _notificationBuilder = [moduleRegistry getModuleImplementingProtocol:@protocol(EXNotificationBuilder)];
}

# pragma mark - Helpers

- (NSArray * _Nonnull)serializeNotifications:(NSArray<UNNotification *> * _Nonnull)notifications
{
  NSMutableArray *serializedNotifications = [NSMutableArray new];
  for (UNNotification *notification in notifications) {
    [serializedNotifications addObject:[EXNotificationSerializer serializedNotification:notification]];
  }
  return serializedNotifications;
}

@end
