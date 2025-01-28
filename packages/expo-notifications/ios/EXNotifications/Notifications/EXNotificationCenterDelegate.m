// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationCenterDelegate.h>
#import <ExpoModulesCore/EXDefines.h>
#import <EXNotifications/EXNotificationsDelegate.h>

#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <EXNotifications/EXNotifications-Swift.h>
#else
#import "EXNotifications-Swift.h"
#endif

@interface EXNotificationCenterDelegate ()

@property (nonatomic, strong) NSPointerArray *delegates;
@property (nonatomic, strong) NSMutableArray<UNNotificationResponse *> *pendingNotificationResponses;
@property (nonatomic, weak) EXNotificationCenterManager *notificationCenterManager;

@end

@implementation EXNotificationCenterDelegate

EX_REGISTER_SINGLETON_MODULE(NotificationCenterDelegate);

- (instancetype)init
{
  if (self = [super init]) {
    _delegates = [NSPointerArray weakObjectsPointerArray];
    _pendingNotificationResponses = [NSMutableArray array];
    _notificationCenterManager = [EXNotificationCenterManager shared];
  }
  return self;
}

# pragma mark - UIApplicationDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary<UIApplicationLaunchOptionsKey,id> *)launchOptions
{
  if ([UNUserNotificationCenter currentNotificationCenter].delegate) {
    EXLogWarn(@"[expo-notifications] EXNotificationCenterDelegate encountered already present delegate of UNUserNotificationCenter: %@. "
              "EXNotificationCenterDelegate will not overwrite the value not to break other features of your app. "
              "In return, expo-notifications may not work properly. "
              "To fix this problem either remove setting of the second delegate "
              "or set the delegate to an instance of EXNotificationCenterDelegate manually afterwards.",
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
  // Delegate to the new Swift code
  [_notificationCenterManager userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  // Save last response here for use by EXNotificationsEmitter
  self.lastNotificationResponse = response;
  // Save response to pending responses array if none of the handlers will handle it.
  BOOL responseWillBeHandledByAppropriateDelegate = NO;
  for (int i = 0; i < _delegates.count; i++) {
    id pointer = [_delegates pointerAtIndex:i];
    if ([pointer respondsToSelector:@selector(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:)]) {
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
  // Delegate to the new Swift manager
  [_notificationCenterManager userNotificationCenter:center openSettingsForNotification:notification];
}

# pragma mark - EXNotificationCenterDelegate

- (void)addDelegate:(id<EXNotificationsDelegate>)delegate
{
  [_delegates addPointer:(__bridge void * _Nullable)(delegate)];
  if ([delegate respondsToSelector:@selector(userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:)]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    for (UNNotificationResponse *response in _pendingNotificationResponses) {
      [delegate userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:^{
        // completion handler doesn't need to do anything
      }];
    }
  }
}

- (void)removeDelegate:(id<EXNotificationsDelegate>)delegate
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
