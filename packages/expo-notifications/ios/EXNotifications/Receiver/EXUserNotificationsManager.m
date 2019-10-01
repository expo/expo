// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXNotifications/EXUserNotificationsManager.h>
#import <UMCore/UMDefines.h>

static NSString *userDefaultsKey = @"expo.modules.notifications.pendingEvents";

@interface EXUserNotificationsManager ()

@property (nonatomic, strong) NSMutableArray *pendingEvents;
@property (nonatomic, strong) NSHashTable<id<UMNotificationsConsumer>> *notificationConsumers;

@end

@implementation EXUserNotificationsManager

UM_REGISTER_SINGLETON_MODULE(NotificationsManager);

- (instancetype)init
{
  if (self = [super init]) {
    _notificationConsumers = [NSHashTable weakObjectsHashTable];

    // Load pending events from memory (they may have been edited while the app was in bg)
    NSData *data = [[NSUserDefaults standardUserDefaults] dataForKey:userDefaultsKey];
    NSArray *fetchedEvents = [NSKeyedUnarchiver unarchiveObjectWithData:data];
    _pendingEvents = [fetchedEvents mutableCopy] ?: [NSMutableArray new];
  }
  return self;
}

- (void)addNotificationsConsumer:(id<UMNotificationsConsumer>)consumer
{
  [_notificationConsumers addObject:consumer];
  @synchronized (_pendingEvents) {
    // Let the consumer consume any pending events.
    _pendingEvents = [[consumer consumeNotificationEvents:_pendingEvents] mutableCopy];
  }
}

- (void)removeNotificationsConsumer:(id<UMNotificationsConsumer>)consumer
{
  [_notificationConsumers removeObject:consumer];
}

# pragma mark - UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  // Go through the consumers and see if any will handle the response. If so, we can early return.
  NSSet<id<UMNotificationsConsumer>> *consumersSet = [_notificationConsumers setRepresentation];
  for (id<UMNotificationsConsumer> consumer in consumersSet) {
    BOOL consumerHandledResponse = [consumer userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
    if (consumerHandledResponse) {
      return;
    }
  }

  // If we managed to get here, no consumer has handled the response.
  // Let's save the event for later...
  [self appendEvent:response];
  // ...and respond to the OS.
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  // Go through the consumers and see if any will handle the response. If so, we can early return.
  NSSet<id<UMNotificationsConsumer>> *consumersSet = [_notificationConsumers setRepresentation];
  for (id<UMNotificationsConsumer> consumer in consumersSet) {
    BOOL consumerHandledNotification = [consumer userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
    if (consumerHandledNotification) {
      return;
    }
  }

  // If we managed to get here, no consumer has handled the notification.
  // Let's save the event for later...
  [self appendEvent:notification];
  // ...and respond to the OS with our best guess regarding the presentation option.
  completionHandler([self presentationOptionsForNotification:notification]);
}

- (void)appendEvent:(id<NSCoding>)event
{
  @synchronized (_pendingEvents) {
    [_pendingEvents addObject:event];
    @try {
      NSData *encodedEvents = [NSKeyedArchiver archivedDataWithRootObject:_pendingEvents];
      [[NSUserDefaults standardUserDefaults] setValue:encodedEvents forKey:userDefaultsKey];
    } @catch (NSException *e) {
      NSLog(@"%@", e.debugDescription);
      // our fault!
      return;
    }
  }
}

- (UNNotificationPresentationOptions)presentationOptionsForNotification:(UNNotification *)notification
{
  UNNotificationContent *content = notification.request.content;

  UNNotificationPresentationOptions presentationOptions = UNNotificationPresentationOptionNone;
  presentationOptions += content.badge ? UNNotificationPresentationOptionBadge : 0;
  presentationOptions += content.sound ? UNNotificationPresentationOptionSound : 0;
  presentationOptions += content.userInfo[@"showInForeground"] ? UNNotificationPresentationOptionAlert : 0;

  return presentationOptions;
}

@end
