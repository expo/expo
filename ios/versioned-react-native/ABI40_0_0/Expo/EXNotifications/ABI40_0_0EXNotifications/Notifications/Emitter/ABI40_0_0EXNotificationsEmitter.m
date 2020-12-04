// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsEmitter.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationSerializer.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationCenterDelegate.h>

#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitterService.h>

@interface ABI40_0_0EXNotificationsEmitter ()

@property (nonatomic, weak) id<ABI40_0_0EXNotificationCenterDelegate> notificationCenterDelegate;

@property (nonatomic, assign) BOOL isBeingObserved;

@property (nonatomic, weak) id<ABI40_0_0UMEventEmitterService> eventEmitter;

@property (nonatomic, strong) UNNotificationResponse *lastNotificationResponse;

@end

@implementation ABI40_0_0EXNotificationsEmitter

ABI40_0_0UM_EXPORT_MODULE(ExpoNotificationsEmitter);

ABI40_0_0UM_EXPORT_METHOD_AS(getLastNotificationResponseAsync,
                    getLastNotificationResponseAsyncWithResolver:(ABI40_0_0UMPromiseResolveBlock)resolve reject:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  resolve(_lastNotificationResponse ? [self serializedNotificationResponse:_lastNotificationResponse] : [NSNull null]);
}

# pragma mark - ABI40_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI40_0_0UMEventEmitterService)];

  _notificationCenterDelegate = [moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
  [_notificationCenterDelegate addDelegate:self];
}

# pragma mark - ABI40_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[onDidReceiveNotification, onDidReceiveNotificationResponse];
}

- (void)startObserving
{
  _isBeingObserved = YES;
}

- (void)stopObserving
{
  _isBeingObserved = NO;
}

# pragma mark - ABI40_0_0EXNotificationsDelegate

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  // Background task execution would happen here.
  completionHandler(UIBackgroundFetchResultNoData);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  _lastNotificationResponse = response;
  [self sendEventWithName:onDidReceiveNotificationResponse body:[self serializedNotificationResponse:response]];
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  [self sendEventWithName:onDidReceiveNotification body:[self serializedNotification:notification]];
  completionHandler(UNNotificationPresentationOptionNone);
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  // Silence ABI40_0_0React Native warning: "Sending ... with no listeners registered."
  // See: https://github.com/expo/expo/pull/10883#pullrequestreview-529183413
  if (_isBeingObserved) {
    [_eventEmitter sendEventWithName:eventName body:body];
  }
}

- (NSDictionary *)serializedNotification:(UNNotification *)notification
{
  return [ABI40_0_0EXNotificationSerializer serializedNotification:notification];
}

- (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)notificationResponse
{
  return [ABI40_0_0EXNotificationSerializer serializedNotificationResponse:notificationResponse];
}

@end
