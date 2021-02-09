// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsEmitter.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationSerializer.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationCenterDelegate.h>

#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitterService.h>

@interface ABI39_0_0EXNotificationsEmitter ()

@property (nonatomic, weak) id<ABI39_0_0EXNotificationCenterDelegate> notificationCenterDelegate;

@property (nonatomic, assign) BOOL isListening;
@property (nonatomic, assign) BOOL isBeingObserved;

@property (nonatomic, weak) id<ABI39_0_0UMEventEmitterService> eventEmitter;

@end

@implementation ABI39_0_0EXNotificationsEmitter

ABI39_0_0UM_EXPORT_MODULE(ExpoNotificationsEmitter);

# pragma mark - ABI39_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry
{
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI39_0_0UMEventEmitterService)];
  _notificationCenterDelegate = [moduleRegistry getSingletonModuleForName:@"NotificationCenterDelegate"];
}

# pragma mark - ABI39_0_0UMEventEmitter

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

# pragma mark - ABI39_0_0EXNotificationsDelegate

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  // Background task execution would happen here.
  completionHandler(UIBackgroundFetchResultNoData);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  [_eventEmitter sendEventWithName:onDidReceiveNotificationResponse body:[ABI39_0_0EXNotificationSerializer serializedNotificationResponse:response]];
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  [_eventEmitter sendEventWithName:onDidReceiveNotification body:[ABI39_0_0EXNotificationSerializer serializedNotification:notification]];
  completionHandler(UNNotificationPresentationOptionNone);
}

@end
