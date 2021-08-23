// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationPresentationModule.h>

#import <EXNotifications/EXNotificationBuilder.h>
#import <EXNotifications/EXNotificationSerializer.h>
#import <EXNotifications/EXNotificationCenterDelegate.h>

@interface EXNotificationPresentationModule ()

@property (nonatomic, weak) id<EXNotificationBuilder> notificationBuilder;

// Remove once presentNotificationAsync is removed
@property (nonatomic, strong) NSCountedSet<NSString *> *presentedNotifications;
@property (nonatomic, weak) id<EXNotificationCenterDelegate> notificationCenterDelegate;

@end

@implementation EXNotificationPresentationModule

EX_EXPORT_MODULE(ExpoNotificationPresenter);

// Remove once presentNotificationAsync is removed
- (instancetype)init
{
  if (self = [super init]) {
    _presentedNotifications = [NSCountedSet set];
  }
  return self;
}

# pragma mark - Exported methods

// Remove once presentNotificationAsync is removed
EX_EXPORT_METHOD_AS(presentNotificationAsync,
                    presentNotificationWithIdentifier:(NSString *)identifier
                    notification:(NSDictionary *)notificationSpec
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  UNNotificationContent *content = [_notificationBuilder notificationContentFromRequest:notificationSpec];
  UNNotificationTrigger *trigger = nil;
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:trigger];
  [_presentedNotifications addObject:identifier];
  __weak EXNotificationPresentationModule *weakSelf = self;
  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      // If there was no error, willPresentNotification: callback will remove the identifier from the set
      [weakSelf.presentedNotifications removeObject:identifier];
      NSString *message = [NSString stringWithFormat:@"Notification could not have been presented: %@", error.description];
      reject(@"ERR_NOTIF_PRESENT", message, error);
    } else {
      resolve(identifier);
    }
  }];
}

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

  // Remove once presentNotificationAsync is removed
  id<EXNotificationCenterDelegate> notificationCenterDelegate = (id<EXNotificationCenterDelegate>)[moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
  [notificationCenterDelegate addDelegate:self];
}

// Remove once presentNotificationAsync is removed
# pragma mark - EXNotificationsDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  UNNotificationPresentationOptions presentationOptions = UNNotificationPresentationOptionNone;

  NSString *identifier = notification.request.identifier;
  if ([_presentedNotifications containsObject:identifier]) {
    [_presentedNotifications removeObject:identifier];
    // TODO(iOS 14): use UNNotificationPresentationOptionList and UNNotificationPresentationOptionBanner
    presentationOptions = UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge;
  }

  completionHandler(presentationOptions);
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
