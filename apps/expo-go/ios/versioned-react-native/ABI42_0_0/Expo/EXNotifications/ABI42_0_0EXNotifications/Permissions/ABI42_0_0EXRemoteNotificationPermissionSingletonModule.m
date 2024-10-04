
// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXNotifications/ABI42_0_0EXRemoteNotificationPermissionSingletonModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>

@interface ABI42_0_0EXRemoteNotificationPermissionSingletonModule ()

@property (nonatomic, strong) NSPointerArray *delegates;

@end

@implementation ABI42_0_0EXRemoteNotificationPermissionSingletonModule

ABI42_0_0UM_REGISTER_SINGLETON_MODULE(RemoteNotificationPermissionPublisher);

- (instancetype)init
{
  if (self = [super init]) {
    _delegates = [NSPointerArray weakObjectsPointerArray];
  }
  return self;
}

# pragma mark - UIApplicationDelegate

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token
{
  // Copying the array in case delegates remove themselves while handling the "did finish" event
  NSPointerArray *immutableDelegates = [_delegates copy];
  for (int i = 0; i < immutableDelegates.count; i++) {
    id pointer = [immutableDelegates pointerAtIndex:i];
    [pointer handleDidFinishRegisteringForRemoteNotifications];
  }
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  // Copying the array in case delegates remove themselves while handling the "did finish" event
  NSPointerArray *immutableDelegates = [_delegates copy];
  for (int i = 0; i < immutableDelegates.count; i++) {
    id pointer = [_delegates pointerAtIndex:i];
    [pointer handleDidFinishRegisteringForRemoteNotifications];
  }
}

# pragma mark - ABI42_0_0EXNotificationCenterDelegate

- (void)addDelegate:(id<ABI42_0_0EXRemoteNotificationPermissionDelegate>)delegate
{
  [_delegates addPointer:(__bridge void * _Nullable)(delegate)];
}

- (void)removeDelegate:(id<ABI42_0_0EXRemoteNotificationPermissionDelegate>)delegate
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
