// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotifications.h>
#import <EXNotifications/EXUserNotificationCenter.h>
#import <UMCore/UMEventEmitterService.h>
#import <EXNotifications/UMNotificationTokenManager.h>
#import <EXNotifications/EXUserNotificationsManager.h>
#import <EXNotifications/EXNotifications+Serialization.h>

@interface EXNotifications ()

@property (strong, atomic) id<EXUserNotificationCenterProxy> userNotificationCenter;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;

@end

@implementation EXNotifications

UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
    return @"ExponentNotifications";
}

- (instancetype)init
{
  if (self = [super init]) {
      self.userNotificationCenter = [EXUserNotificationCenter sharedInstance];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(UMEventEmitter)];
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [((id<UMNotificationsManager>)[_moduleRegistry getSingletonModuleForName:@"NotificationsManager"]) addNotificationsConsumer:self];
  _eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
}

UM_EXPORT_METHOD_AS(presentLocalNotification,
                    presentLocalNotification:(NSDictionary *)payload
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (!payload[@"data"]) {
    reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
    return;
  }
  UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
  
  NSMutableDictionary *userInfo =  [content.userInfo mutableCopy];
  [userInfo setObject:@(YES) forKey:@"showInForeground"];
  content.userInfo = userInfo;

  UNTimeIntervalNotificationTrigger *notificationTrigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:10 repeats:NO];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:content.userInfo[@"id"]
                                                                        content:content
                                                                        trigger:notificationTrigger];
  
  [self.userNotificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"E_NOTIF", [NSString stringWithFormat:@"Could not add a notification request: %@", error.localizedDescription], error);
    } else {
      resolve(content.userInfo[@"id"]);
    }
  }];
}

UM_EXPORT_METHOD_AS(scheduleNotificationWithTimer,
                    scheduleNotificationWithTimer:(NSDictionary *)payload
                    withOptions:(NSDictionary *)options
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (!payload[@"data"]) {
    reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
    return;
  }
  BOOL repeats = [options[@"repeat"] boolValue];
  int seconds = [options[@"interval"] intValue] / 1000;
  UNTimeIntervalNotificationTrigger *notificationTrigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:seconds repeats:repeats];
  UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:content.userInfo[@"id"]
                                                                        content:content
                                                                        trigger:notificationTrigger];
  [_userNotificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"E_NOTIF_REQ", error.localizedDescription, error);
    } else {
      resolve(content.userInfo[@"id"]);
    }
  }];
}

UM_EXPORT_METHOD_AS(scheduleNotificationWithCalendar,
                    scheduleNotificationWithCalendar:(NSDictionary *)payload
                    withOptions:(NSDictionary *)options
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (!payload[@"data"]) {
    reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
    return;
  }
  UNCalendarNotificationTrigger *notificationTrigger = [self calendarTriggerFrom:options];
  UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:content.userInfo[@"id"]
                                                                        content:content
                                                                        trigger:notificationTrigger];
  [_userNotificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"E_NOTIF_REQ", error.localizedDescription, error);
    } else {
      resolve(content.userInfo[@"id"]);
    }
  }];
}

UM_EXPORT_METHOD_AS(cancelScheduledNotificationAsync,
                    cancelScheduledNotificationAsync:(NSString *)uniqueId
                    withResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  __weak id<EXUserNotificationCenterProxy> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    for (UNNotificationRequest *request in requests) {
      if ([request.content.userInfo[@"id"] isEqualToString:uniqueId]) {
        [userNotificationCenter removePendingNotificationRequestsWithIdentifiers:@[request.identifier]];
        return resolve(nil);
      }
    }
    reject(@"E_NO_NOTIF", [NSString stringWithFormat:@"Could not find pending notification request to cancel with id = %@", uniqueId], nil);
  }];
}

UM_EXPORT_METHOD_AS(cancelAllScheduledNotificationsAsync,
                    cancelAllScheduledNotificationsAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  __weak id<EXUserNotificationCenterProxy> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    NSMutableArray<NSString *> *requestsToCancelIdentifiers = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      [requestsToCancelIdentifiers addObject:request.identifier];
    }
    [userNotificationCenter removePendingNotificationRequestsWithIdentifiers:requestsToCancelIdentifiers];
    resolve(nil);
  }];
}

#pragma mark - Badges

// TODO: Make this read from the kernel instead of UIApplication for the main Exponent app

UM_EXPORT_METHOD_AS(getBadgeNumberAsync,
                    getBadgeNumberAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  __block NSInteger badgeNumber;
  dispatch_async(dispatch_get_main_queue(), ^{
    badgeNumber = [UIApplication sharedApplication].applicationIconBadgeNumber;
  });
  
  resolve(@(badgeNumber));
}

UM_EXPORT_METHOD_AS(setBadgeNumberAsync,
                    setBadgeNumberAsync:(nonnull NSNumber *)number
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication sharedApplication].applicationIconBadgeNumber = number.integerValue;
  });
  resolve(nil);
}

UM_EXPORT_METHOD_AS(registerForPushNotificationsAsync,
                   registerForPushNotificationsAsync:(UMPromiseResolveBlock)resolve
                                            rejecter:(UMPromiseRejectBlock)reject)
{
  id tokenManager = [_moduleRegistry getSingletonModuleForName:@"NotificationTokenManager"];
  [tokenManager addListener:self];
  dispatch_async(dispatch_get_main_queue(), ^{
    [[UIApplication sharedApplication] registerForRemoteNotifications];
  });
  resolve(nil);
}

# pragma mark - Categories

UM_EXPORT_METHOD_AS(createCategoryAsync,
                    createCategoryWithCategoryId:(NSString *)categoryId
                    actions:(NSArray *)actions
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSMutableArray<UNNotificationAction *> *actionsArray = [[NSMutableArray alloc] init];
  for (NSDictionary<NSString *, id> *actionParams in actions) {
    [actionsArray addObject:[self parseNotificationActionFromParams:actionParams]];
  }
  
  UNNotificationCategory *newCategory = [UNNotificationCategory categoryWithIdentifier:categoryId
            actions:actionsArray
  intentIdentifiers:@[]
            options:UNNotificationCategoryOptionNone];
  
  __weak id<EXUserNotificationCenterProxy> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:newCategory.identifier]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [newCategories addObject:newCategory];
    [userNotificationCenter setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

UM_EXPORT_METHOD_AS(deleteCategoryAsync,
                    deleteCategoryWithCategoryId:(NSString *)categoryId
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  __weak id<EXUserNotificationCenterProxy> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:categoryId]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [userNotificationCenter setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

#pragma mark - internal

- (UNMutableNotificationContent *)_localNotificationFromPayload:(NSDictionary *)payload
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  content.title = payload[@"title"];
  content.body = payload[@"body"];

  if ([payload[@"sound"] boolValue]) {
    content.sound = [UNNotificationSound defaultSound];
  }

  if ([payload[@"count"] isKindOfClass:[NSNumber class]]) {
    content.badge = (NSNumber *)payload[@"count"];
  }

  if ([payload[@"categoryId"] isKindOfClass:[NSString class]]) {
    content.categoryIdentifier = payload[@"categoryId"];
  }

  content.userInfo = @{
                       @"body": payload[@"data"],
                       @"id": uniqueId,
                       };

  return content;
}

- (UNCalendarNotificationTrigger *)calendarTriggerFrom:(NSDictionary *)options
{
  BOOL repeats = [options[@"repeat"] boolValue];
  
  NSDateComponents *date = [[NSDateComponents alloc] init];
  
  NSArray *timeUnits = @[@"year", @"day", @"weekDay", @"month", @"hour", @"second", @"minute"];
  
  for (NSString *timeUnit in timeUnits) {
    if (options[timeUnit]) {
      [date setValue:options[timeUnit] forKey:timeUnit];
    }
  }
  
  return [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:date repeats:repeats];
}


- (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
{
  NSString *actionId = params[@"actionId"];
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

- (void)onForegroundNotification:(NSDictionary *)notification
{
  [_eventEmitter sendEventWithName:@"Exponent.onForegroundNotification" body:notification];
}

- (void)onUserInteraction:(NSDictionary *)userInteraction
{
  [_eventEmitter sendEventWithName:@"Exponent.onUserInteraction" body:userInteraction];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Exponent.onUserInteraction", @"Exponent.onForegroundNotification", @"Exponent.onTokenChange"];
}

- (void)startObserving {}
- (void)stopObserving {}

- (void)onNewToken:(NSData *)deviceToken {
  const char *data = [deviceToken bytes];
  NSMutableString *token = [NSMutableString string];

  for (NSUInteger i = 0; i < [deviceToken length]; i++) {
    [token appendFormat:@"%02.2hhX", data[i]];
  }

  [_eventEmitter sendEventWithName:@"Exponent.onTokenChange" body:@{@"token":[token copy]}];
}

- (void)onFailedToRegisterWithError:(NSError *)error {
  [_eventEmitter sendEventWithName:@"Exponent.onTokenChange" body:@{@"error":[error debugDescription], @"token": [NSNull null]}];
}

- (NSArray *)consumeNotificationEvents:(NSArray *)events {
  for (id event in events) {
    if ([event isKindOfClass:[UNNotification class]]) {
      UNNotification *notification = event;
      [self onForegroundNotification:[self eventFromNotificationContent:notification.request.content]];
    } else if ([event isKindOfClass:[UNNotificationResponse class]]) {
      UNNotificationResponse *response = event;
      [self onUserInteraction:[self eventFromNotificationResponse:response]];
    }
  }
  return [NSArray new];
}

- (BOOL)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler {
  [self onUserInteraction:[self eventFromNotificationResponse:response]];
  completionHandler();
  return YES;
}

- (BOOL)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
  // Let's let the manager do the job.
  return NO;
}

@end
