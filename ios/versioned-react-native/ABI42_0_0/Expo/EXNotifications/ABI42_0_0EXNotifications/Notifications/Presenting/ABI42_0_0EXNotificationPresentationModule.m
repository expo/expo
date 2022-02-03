// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationPresentationModule.h>

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationBuilder.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationSerializer.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationCenterDelegate.h>

@interface ABI42_0_0EXNotificationPresentationModule ()

@property (nonatomic, weak) id<ABI42_0_0EXNotificationBuilder> notificationBuilder;

// Remove once presentNotificationAsync is removed
@property (nonatomic, strong) NSCountedSet<NSString *> *presentedNotifications;
@property (nonatomic, weak) id<ABI42_0_0EXNotificationCenterDelegate> notificationCenterDelegate;

@end

@implementation ABI42_0_0EXNotificationPresentationModule

ABI42_0_0UM_EXPORT_MODULE(ExpoNotificationPresenter);

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
ABI42_0_0UM_EXPORT_METHOD_AS(presentNotificationAsync,
                    presentNotificationWithIdentifier:(NSString *)identifier
                    notification:(NSDictionary *)notificationSpec
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  UNNotificationContent *content = [_notificationBuilder notificationContentFromRequest:notificationSpec];
  UNNotificationTrigger *trigger = nil;
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:trigger];
  [_presentedNotifications addObject:identifier];
  __weak ABI42_0_0EXNotificationPresentationModule *weakSelf = self;
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

ABI42_0_0UM_EXPORT_METHOD_AS(getPresentedNotificationsAsync,
                    getPresentedNotificationsAsyncWithResolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    resolve([self serializeNotifications:notifications]);
  }];
}


ABI42_0_0UM_EXPORT_METHOD_AS(dismissNotificationAsync,
                    dismissNotificationWithIdentifier:(NSString *)identifier
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[identifier]];
  resolve(nil);
}

ABI42_0_0UM_EXPORT_METHOD_AS(dismissAllNotificationsAsync,
                    dismissAllNotificationsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
  resolve(nil);
}

# pragma mark - ABI42_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _notificationBuilder = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXNotificationBuilder)];

  // Remove once presentNotificationAsync is removed
  id<ABI42_0_0EXNotificationCenterDelegate> notificationCenterDelegate = (id<ABI42_0_0EXNotificationCenterDelegate>)[moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
  [notificationCenterDelegate addDelegate:self];
}

// Remove once presentNotificationAsync is removed
# pragma mark - ABI42_0_0EXNotificationsDelegate

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
    [serializedNotifications addObject:[ABI42_0_0EXNotificationSerializer serializedNotification:notification]];
  }
  return serializedNotifications;
}

@end
