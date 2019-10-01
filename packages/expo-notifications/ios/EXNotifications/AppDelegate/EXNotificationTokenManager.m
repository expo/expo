// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationTokenManager.h>
#import <UMCore/UMDefines.h>

@interface EXNotificationTokenManager ()

@property (nonatomic, strong) NSPointerArray *listeners;

@end

@implementation EXNotificationTokenManager

UM_REGISTER_SINGLETON_MODULE(NotificationTokenManager);

- (instancetype)init
{
  if (self = [super init]) {
    _listeners = [NSPointerArray weakObjectsPointerArray];
  }
  return self;
}

# pragma mark - UIApplicationDelegate

- (void)application:(UIApplication *)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  for (int i = 0; i < _listeners.count; i++) {
    id<UMNotificationTokenListener> pointer = [_listeners pointerAtIndex:i];
    [pointer onNewToken:deviceToken];
  }
}

- (void)application:(UIApplication *)app didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  for (int i = 0; i < _listeners.count; i++) {
    id<UMNotificationTokenListener> pointer = [_listeners pointerAtIndex:i];
    [pointer onFailedToRegisterWithError:error];
  }
}

# pragma mark - UMNotificationTokenManager

- (void)addListener:(id<UMNotificationTokenListener>)listener
{
  [_listeners addPointer:(__bridge void * _Nullable)(listener)];
}

- (void)removeListener:(id<UMNotificationTokenListener>)listener
{
  for (int i = 0; i < _listeners.count; i++) {
    id pointer = [_listeners pointerAtIndex:i];
    if (pointer == (__bridge void * _Nullable)(listener) || !pointer) {
      [_listeners removePointerAtIndex:i];
      i--;
    }
  }
  // compact doesn't work, that's why we need the `|| !pointer` above
  // http://www.openradar.me/15396578
  [_listeners compact];
}

@end
