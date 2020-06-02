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
//@property (nonatomic, weak) id <EXUserNotificationCenterService> userNotificationCenter;

@end

@implementation EXNotificationPresentationModule

UM_EXPORT_MODULE(ExpoNotificationPresenter);

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
UM_EXPORT_METHOD_AS(presentNotificationAsync,
                    presentNotificationWithIdentifier:(NSString *)identifier
                    notification:(NSDictionary *)notificationSpec
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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

UM_EXPORT_METHOD_AS(getPresentedNotificationsAsync,
                    getPresentedNotificationsAsyncWithResolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    resolve([self serializeNotifications:notifications]);
  }];
}


UM_EXPORT_METHOD_AS(dismissNotificationAsync,
                    dismissNotificationWithIdentifier:(NSString *)identifier
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:@[identifier]];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(dismissAllNotificationsAsync,
                    dismissAllNotificationsWithResolver:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
  resolve(nil);
}

# pragma mark - Categories

UM_EXPORT_METHOD_AS(createCategoryAsync,
                    createCategoryWithCategoryId:(NSString *)categoryId
                    actions:(NSArray *)actions
//                    previewPlaceholder: (NSString *)previewPlaceholder
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSMutableArray<UNNotificationAction *> *actionsArray = [[NSMutableArray alloc] init];
  for (NSDictionary<NSString *, id> *actionParams in actions) {
    [actionsArray addObject:[self parseNotificationActionFromParams:actionParams]];
  }

  UNNotificationCategory *newCategory;
  if (@available(iOS 11, *)) {
//    newCategory = [UNNotificationCategory categoryWithIdentifier:[self internalIdForIdentifier:categoryId]
//                                                                     actions:actionsArray
//                                                                     intentIdentifiers:@[]
//                                                                     hiddenPreviewsBodyPlaceholder: previewPlaceholder
//                                                                     options:UNNotificationCategoryOptionNone];
    newCategory = [UNNotificationCategory categoryWithIdentifier:[self categoryIdForIdentifier:categoryId]
                                                                  actions:actionsArray
                                                                  intentIdentifiers:@[]
                                                                  options:UNNotificationCategoryOptionNone];
  } else {
    newCategory = [UNNotificationCategory categoryWithIdentifier:[self categoryIdForIdentifier:categoryId]
                                                                  actions:actionsArray
                                                                  intentIdentifiers:@[]
                                                                  options:UNNotificationCategoryOptionNone];
  }

  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:newCategory.identifier]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [newCategories addObject:newCategory];
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

UM_EXPORT_METHOD_AS(deleteCategoryAsync,
                 deleteCategoryWithCategoryId:(NSString *)categoryId
                 resolve:(UMPromiseResolveBlock)resolve
                 reject:(UMPromiseRejectBlock)reject)
{
  NSString *internalCategoryId = [self internalIdForIdentifier:categoryId];
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:internalCategoryId]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
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

- (NSString *)internalIdForIdentifier:(NSString *)identifier {
  NSString *prefix = @"expo.modules.notifications.actions.";
  return [prefix stringByAppendingString:identifier];
//  return [_notificationsIdentifiersManager internalIdForIdentifier:identifier experienceId:self.experienceId];
}

- (NSString *)categoryIdForIdentifier:(NSString *)identifier {
  NSString *prefix = @"";
  return [prefix stringByAppendingString:identifier];
//  return [_notificationsIdentifiersManager internalIdForIdentifier:identifier experienceId:self.experienceId];
}

- (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
{
  NSString *actionId = [self internalIdForIdentifier:params[@"actionId"]];
  NSString *buttonTitle = params[@"buttonTitle"];

  UNNotificationActionOptions options = UNNotificationActionOptionNone;
  if (![params[@"doNotOpenInForeground"] boolValue]) {
    options += UNNotificationActionOptionForeground;
  }
  if ([params[@"isDestructive"] boolValue]) {
    options += UNNotificationActionOptionDestructive;
  }
  if ([params[@"isAuthenticationRequired"] boolValue]) {
    options += UNNotificationActionOptionAuthenticationRequired;
  }

  if ([params[@"textInput"] isKindOfClass:[NSDictionary class]]) {
    return [UNTextInputNotificationAction actionWithIdentifier:actionId
                                                         title:buttonTitle
                                                       options:options
                                          textInputButtonTitle:params[@"textInput"][@"submitButtonTitle"]
                                          textInputPlaceholder:params[@"textInput"][@"placeholder"]];
  }

  return [UNNotificationAction actionWithIdentifier:actionId title:buttonTitle options:options];
}

@end
