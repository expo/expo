// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationsEmitter.h>
#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationSerializer.h>
#import <ABI41_0_0EXNotifications/ABI41_0_0EXNotificationCenterDelegate.h>

#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>

@interface ABI41_0_0EXNotificationsEmitter ()

@property (nonatomic, weak) id<ABI41_0_0EXNotificationCenterDelegate> notificationCenterDelegate;

@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, assign) BOOL isListening;

@property (nonatomic, weak) id<ABI41_0_0UMEventEmitterService> eventEmitter;

@property (nonatomic, strong) UNNotificationResponse *lastNotificationResponse;

@end

@implementation ABI41_0_0EXNotificationsEmitter

ABI41_0_0UM_EXPORT_MODULE(ExpoNotificationsEmitter);

ABI41_0_0UM_EXPORT_METHOD_AS(getLastNotificationResponseAsync,
                    getLastNotificationResponseAsyncWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  resolve(_lastNotificationResponse ? [self serializedNotificationResponse:_lastNotificationResponse] : [NSNull null]);
}

# pragma mark - ABI41_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMEventEmitterService)];
  _notificationCenterDelegate = [moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
}

# pragma mark - ABI41_0_0UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[onDidReceiveNotification, onDidReceiveNotificationResponse];
}

- (void)startObserving
{
  [self setIsBeingObserved:YES];
}

- (void)stopObserving
{
  [self setIsBeingObserved:NO];
}

- (void)setIsBeingObserved:(BOOL)isBeingObserved
{
  _isBeingObserved = isBeingObserved;
  BOOL shouldListen = _isBeingObserved;
  if (shouldListen && !_isListening) {
    [_notificationCenterDelegate addDelegate:self];
    _isListening = YES;
  } else if (!shouldListen && _isListening) {
    [_notificationCenterDelegate removeDelegate:self];
    _isListening = NO;
  }
}

# pragma mark - ABI41_0_0EXNotificationsDelegate

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
  // Silence ABI41_0_0React Native warning: "Sending ... with no listeners registered."
  // See: https://github.com/expo/expo/pull/10883#pullrequestreview-529183413
  // While in practice we don't need to verify this, as as of the end of 2020
  // we wouldn't send any event to JS if we weren't being observed because
  // we wouldn't be subscribed to the notification center delegate it's nice
  // to be sure this problem won't ever arise.
  if (_isBeingObserved) {
    [_eventEmitter sendEventWithName:eventName body:body];
  }
}

- (NSDictionary *)serializedNotification:(UNNotification *)notification
{
  return [ABI41_0_0EXNotificationSerializer serializedNotification:notification];
}

- (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)notificationResponse
{
  return [ABI41_0_0EXNotificationSerializer serializedNotificationResponse:notificationResponse];
}

@end
