// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationTokenManager.h>
#import <UMCore/UMDefines.h>

@interface EXNotificationTokenManager ()

@property (nonatomic, strong) NSHashTable<id<UMNotificationTokenListener>> *listeners;

@end

@implementation EXNotificationTokenManager

UM_REGISTER_SINGLETON_MODULE(NotificationTokenManager);

- (instancetype)init
{
  if (self = [super init]) {
    _listeners = [NSHashTable weakObjectsHashTable];
  }
  return self;
}

# pragma mark - UIApplicationDelegate

- (void)application:(UIApplication *)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  for (id<UMNotificationTokenListener> listener in [_listeners setRepresentation]) {
    [listener onNewToken:deviceToken];
  }
}

- (void)application:(UIApplication *)app didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  for (id<UMNotificationTokenListener> listener in [_listeners setRepresentation]) {
    [listener onFailedToRegisterWithError:error];
  }
}

# pragma mark - UMNotificationTokenManager

- (void)addListener:(id<UMNotificationTokenListener>)listener
{
  [_listeners addObject:listener];
}

- (void)removeListener:(id<UMNotificationTokenListener>)listener
{
  [_listeners removeObject:listener];
}

@end
