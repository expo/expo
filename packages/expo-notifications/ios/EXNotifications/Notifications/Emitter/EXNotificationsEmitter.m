// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsEmitter.h>
#import <EXNotifications/EXNotificationSerializer.h>
#import <EXNotifications/EXNotificationCenterDelegate.h>

#import <ExpoModulesCore/EXEventEmitterService.h>

@interface EXNotificationsEmitter ()

@property (nonatomic, weak) id<EXNotificationCenterDelegate> notificationCenterDelegate;

@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, assign) BOOL isListening;

@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@property (nonatomic, strong) UNNotificationResponse *lastNotificationResponse;

@end

@implementation EXNotificationsEmitter

EX_EXPORT_MODULE(ExpoNotificationsEmitter);

EX_EXPORT_METHOD_AS(getLastNotificationResponseAsync,
                    getLastNotificationResponseAsyncWithResolver:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject)
{
  resolve(_lastNotificationResponse ? [self serializedNotificationResponse:_lastNotificationResponse] : [NSNull null]);
}

# pragma mark - EXModuleRegistryConsumer

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  _notificationCenterDelegate = [moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
}

# pragma mark - EXEventEmitter

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

# pragma mark - EXNotificationsDelegate

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
  // Silence React Native warning: "Sending ... with no listeners registered."
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
  return [EXNotificationSerializer serializedNotification:notification];
}

- (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)notificationResponse
{
  return [EXNotificationSerializer serializedNotificationResponse:notificationResponse];
}

@end
