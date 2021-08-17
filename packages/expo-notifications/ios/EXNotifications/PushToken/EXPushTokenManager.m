// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXPushTokenManager.h>
#import <ExpoModulesCore/EXDefines.h>

@interface EXPushTokenManager ()

@property (nonatomic, strong) NSPointerArray *listeners;

@end

@implementation EXPushTokenManager

EX_REGISTER_SINGLETON_MODULE(PushTokenManager);

- (instancetype)init
{
  if (self = [super init]) {
    _listeners = [NSPointerArray weakObjectsPointerArray];
  }
  return self;
}

# pragma mark - UIApplicationDelegate

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  for (int i = 0; i < _listeners.count; i++) {
    id pointer = [_listeners pointerAtIndex:i];
    [pointer onDidRegisterWithDeviceToken:deviceToken];
  }
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  for (int i = 0; i < _listeners.count; i++) {
    id pointer = [_listeners pointerAtIndex:i];
    [pointer onDidFailToRegisterWithError:error];
  }
}

# pragma mark - Listeners

- (void)addListener:(id<EXPushTokenListener>)listener
{
  [_listeners addPointer:(__bridge void * _Nullable)(listener)];
}

- (void)removeListener:(id<EXPushTokenListener>)listener
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
