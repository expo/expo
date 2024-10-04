// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationCenterDelegate.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>
#import <ABI42_0_0EXNotifications/ABI42_0_0EXNotificationsDelegate.h>

@interface ABI42_0_0EXNotificationCenterDelegate ()

@property (nonatomic, strong) NSPointerArray *delegates;
@property (nonatomic, strong) NSMutableArray<UNNotificationResponse *> *pendingNotificationResponses;

@end

@implementation ABI42_0_0EXNotificationCenterDelegate

ABI42_0_0UM_REGISTER_SINGLETON_MODULE(NotificationCenterDelegate);

- (instancetype)init
{
  if (self = [super init]) {
    _delegates = [NSPointerArray weakObjectsPointerArray];
    _pendingNotificationResponses = [NSMutableArray array];
  }
  return self;
}

# pragma mark - UIApplicationDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary<UIApplicationLaunchOptionsKey,id> *)launchOptions
{
  if ([UNUserNotificationCenter currentNotificationCenter].delegate) {
    ABI42_0_0UMLogWarn(@"[expo-notifications] ABI42_0_0EXNotificationCenterDelegate encountered already present delegate of UNUserNotificationCenter: %@. "
              "ABI42_0_0EXNotificationCenterDelegate will not overwrite the value not to break other features of your app. "
              "In return, expo-notifications may not work properly. "
              "To fix this problem either remove setting of the second delegate "
              "or set the delegate to an instance of ABI42_0_0EXNotificationCenterDelegate manually afterwards.",
              [UNUserNotificationCenter currentNotificationCenter].delegate);
    return YES;
  }

  [[UNUserNotificationCenter currentNotificationCenter] setDelegate:self];
  return YES;
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  __block int delegatesCalled = 0;
  __block int delegatesCompleted = 0;
  __block BOOL delegatingCompleted = NO;
  __block BOOL delegatesFailed = 0;
  __block UIBackgroundFetchResult resultSum = UIBackgroundFetchResultNoData;
  __block void (^completionHandlerCaller)(void) = ^{
    if (delegatingCompleted && delegatesCompleted == delegatesCalled) {
      if (delegatesCompleted == delegatesFailed) {
        // If all delegates failed to fetch result, let's let the OS know about that
        completionHandler(UIBackgroundFetchResultFailed);
      } else {
        // If at least one succeeded, let's take it as read and respond with that result.
        completionHandler(resultSum);
      }
    }
  };

  for (int i = 0; i < _delegates.count; i++) {
    id pointer = [_delegates pointerAtIndex:i];
    if ([pointer respondsToSelector:@selector(application:didReceiveRemoteNotification:fetchCompletionHandler:)]) {
      [pointer application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:^(UIBackgroundFetchResult result) {
        @synchronized (self) {
          if (result == UIBackgroundFetchResultFailed) {
            delegatesFailed += 1;
          } else if (result == UIBackgroundFetchResultNewData) {
            resultSum = UIBackgroundFetchResultNewData;
          }
          delegatesCompleted += 1;
          completionHandlerCaller();
        }
      }];
      @synchronized (self) {
        delegatesCalled += 1;
      }
    }
  }
  @synchronized (self) {
    delegatingCompleted = YES;
    completionHandlerCaller();
  }
}

# pragma mark - UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  __block int delegatesCalled = 0;
  __block int delegatesCompleted = 0;
  __block BOOL delegatingCompleted = NO;
  __block UNNotificationPresentationOptions optionsSum = UNNotificationPresentationOptionNone;
  __block void (^completionHandlerCaller)(void) = ^{
    if (delegatingCompleted && delegatesCompleted == delegatesCalled) {
      completionHandler(optionsSum);
    }
  };

  for (int i = 0; i < _delegates.count; i++) {
    id pointer = [_delegates pointerAtIndex:i];
    if ([pointer respondsToSelector:@selector(userNotificationCenter:willPresentNotification:withCompletionHandler:)]) {
      [pointer userNotificationCenter:center willPresentNotification:notification withCompletionHandler:^(UNNotificationPresentationOptions options) {
        @synchronized (self) {
          delegatesCompleted += 1;
          optionsSum = optionsSum | options;
          completionHandlerCaller();
        }
      }];
      @synchronized (self) {
        delegatesCalled += 1;
      }
    }
  }
  @synchronized (self) {
    delegatingCompleted = YES;
    completionHandlerCaller();
  }
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  // Save response to pending responses array if none of the handlers will handle it.
  BOOL responseWillBeHandledByAppropriateDelegate = NO;
  for (int i = 0; i < _delegates.count; i++) {
    id pointer = [_delegates pointerAtIndex:i];
    if ([pointer respondsToSelector:@selector(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:)] 
      && ![NSStringFromClass([pointer class]) isEqual: @"ABI42_0_0EXUserNotificationManager"]) {
      // Remove ABI42_0_0EXUserNotificationManager check when LegacyNotifications are no longer supported
      responseWillBeHandledByAppropriateDelegate = YES;
      break;
    }
  }
  if (!responseWillBeHandledByAppropriateDelegate) {
    [_pendingNotificationResponses addObject:response];
  }

  __block int delegatesCalled = 0;
  __block int delegatesCompleted = 0;
  __block BOOL delegatingCompleted = NO;
  void (^completionHandlerCaller)(void) = ^{
    if (delegatingCompleted && delegatesCompleted == delegatesCalled) {
      completionHandler();
    }
  };

  for (int i = 0; i < _delegates.count; i++) {
    id pointer = [_delegates pointerAtIndex:i];
    if ([pointer respondsToSelector:@selector(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:)]) {
      [pointer userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:^{
        @synchronized (self) {
          delegatesCompleted += 1;
          completionHandlerCaller();
        }
      }];
      @synchronized (self) {
        delegatesCalled += 1;
      }
    }
  }
  @synchronized (self) {
    delegatingCompleted = YES;
    completionHandlerCaller();
  }
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center openSettingsForNotification:(UNNotification *)notification
{
  if (@available(iOS 12.0, *)) {
    for (int i = 0; i < _delegates.count; i++) {
      id pointer = [_delegates pointerAtIndex:i];
      if ([pointer respondsToSelector:@selector(userNotificationCenter:openSettingsForNotification:)]) {
        [pointer userNotificationCenter:center openSettingsForNotification:notification];
      }
    }
  }
}

# pragma mark - ABI42_0_0EXNotificationCenterDelegate

- (void)addDelegate:(id<ABI42_0_0EXNotificationsDelegate>)delegate
{
  [_delegates addPointer:(__bridge void * _Nullable)(delegate)];
  if ([delegate respondsToSelector:@selector(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:)]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    for (UNNotificationResponse *response in _pendingNotificationResponses) {
      [delegate userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:^{
        // completion handler doesn't need to do anything
      }];
    }
    // Remove ABI42_0_0EXUserNotificationManager check when LegacyNotifications are no longer supported
    if (![NSStringFromClass([delegate class]) isEqual:@"ABI42_0_0EXUserNotificationManager"]) {
      [_pendingNotificationResponses removeAllObjects];
    }
  }
}

- (void)removeDelegate:(id<ABI42_0_0EXNotificationsDelegate>)delegate
{
  for (int i = 0; i < _delegates.count; i++) {
    id pointer = [_delegates pointerAtIndex:i];
    if (pointer == (__bridge void * _Nullable)(delegate) || !pointer) {
      [_delegates removePointerAtIndex:i];
      i--;
    }
  }
  // compact doesn't work, that's why we need the `|| !pointer` above
  // http://www.openradar.me/15396578
  [_delegates compact];
}

@end
