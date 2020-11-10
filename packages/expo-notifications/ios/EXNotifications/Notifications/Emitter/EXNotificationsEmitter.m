// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationsEmitter.h>
#import <EXNotifications/EXNotificationSerializer.h>
#import <EXNotifications/EXNotificationCenterDelegate.h>

#import <UMCore/UMEventEmitterService.h>

@interface EXNotificationsEmitter ()

@property (nonatomic, weak) id<EXNotificationCenterDelegate> notificationCenterDelegate;

@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;

@property (nonatomic, strong) UNNotificationResponse *lastNotificationResponse;

@end

@implementation EXNotificationsEmitter

UM_EXPORT_MODULE(ExpoNotificationsEmitter);

UM_EXPORT_METHOD_AS(getLastNotificationResponseAsync,
                    getLastNotificationResponseAsyncWithResolver:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject)
{
  resolve(_lastNotificationResponse ? [EXNotificationSerializer serializedNotificationResponse:_lastNotificationResponse] : [NSNull null]);
}

# pragma mark - UMModuleRegistryConsumer

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];

  _notificationCenterDelegate = [moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
  [_notificationCenterDelegate addDelegate:self];
}

# pragma mark - UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[onDidReceiveNotification, onDidReceiveNotificationResponse];
}

- (void)startObserving
{
}

- (void)stopObserving
{
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
  [_eventEmitter sendEventWithName:onDidReceiveNotificationResponse body:[EXNotificationSerializer serializedNotificationResponse:response]];
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  [_eventEmitter sendEventWithName:onDidReceiveNotification body:[EXNotificationSerializer serializedNotification:notification]];
  completionHandler(UNNotificationPresentationOptionNone);
}

@end
