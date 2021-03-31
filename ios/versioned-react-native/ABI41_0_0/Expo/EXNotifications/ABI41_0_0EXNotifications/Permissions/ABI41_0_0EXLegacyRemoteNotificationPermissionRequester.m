// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXNotifications/ABI41_0_0EXLegacyRemoteNotificationPermissionRequester.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

@interface ABI41_0_0EXLegacyRemoteNotificationPermissionRequester ()

@property (nonatomic, strong) ABI41_0_0UMPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI41_0_0UMPromiseRejectBlock reject;
@property (nonatomic, assign) BOOL remoteNotificationsRegistrationIsPending;
@property (nonatomic, weak) id<ABI41_0_0UMPermissionsRequester> userNotificationPermissionRequester;
@property (nonatomic, weak) dispatch_queue_t methodQueue;
@property (nonatomic, weak) id<ABI41_0_0EXRemoteNotificationPermissionProgressPublisher> permissionProgressPublisher;

@end

@implementation ABI41_0_0EXLegacyRemoteNotificationPermissionRequester

+ (NSString *)permissionType
{
  return @"notifications";
}

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI41_0_0UMPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<ABI41_0_0EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
                                            withMethodQueue:(dispatch_queue_t)methodQueue
{
  if (self = [super init]) {
    _remoteNotificationsRegistrationIsPending = NO;
    _permissionProgressPublisher = permissionProgressPublisher;
    _userNotificationPermissionRequester = userNotificationPermissionRequester;
    _methodQueue = methodQueue;
  }
  return self;
}

- (NSDictionary *)getPermissions
{
  __block ABI41_0_0UMPermissionStatus status;
  [ABI41_0_0UMUtilities performSynchronouslyOnMainThread:^{
    status = (ABI41_0_0UMSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI41_0_0UMPermissionStatusGranted :
    ABI41_0_0UMPermissionStatusUndetermined;
  }];
  NSMutableDictionary *permissions = [[_userNotificationPermissionRequester getPermissions] mutableCopy];
  
  [permissions setValuesForKeysWithDictionary:@{
                                                @"status": @(status),

                                                }];
  return permissions;
}

- (void)requestPermissionsWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve rejecter:(ABI41_0_0UMPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;

  BOOL __block isRegisteredForRemoteNotifications = NO;
  [ABI41_0_0UMUtilities performSynchronouslyOnMainThread:^{
    isRegisteredForRemoteNotifications = ABI41_0_0UMSharedApplication().isRegisteredForRemoteNotifications;
  }];

  if (isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _maybeConsumeResolverWithCurrentPermissions];
  } else {
    [_permissionProgressPublisher addDelegate:self];
     ABI41_0_0UM_WEAKIFY(self)
    [_userNotificationPermissionRequester requestPermissionsWithResolver:^(NSDictionary *permission){
      ABI41_0_0UM_STRONGIFY(self)
      ABI41_0_0UMPermissionStatus localNotificationsStatus = [[permission objectForKey:@"status"] intValue];
      // We may assume that `ABI41_0_0EXLocalNotificationRequester`'s permission request will always finish
      // when the user responds to the dialog or has already responded in the past.
      // However, `UIApplication.registerForRemoteNotification` results in calling
      // `application:didRegisterForRemoteNotificationsWithDeviceToken:` or
      // `application:didFailToRegisterForRemoteNotificationsWithError:` on the application delegate
      // ONLY when the notifications are enabled in settings (by allowing sound, alerts or app badge).
      // So, when the local notifications are disabled, the application delegate's callbacks will not be called instantly.
      if (localNotificationsStatus == ABI41_0_0UMPermissionStatusDenied) {
        [self _clearObserver];
        [self _maybeConsumeResolverWithCurrentPermissions];
      } else {
        self.remoteNotificationsRegistrationIsPending = YES;
        dispatch_async(dispatch_get_main_queue(), ^{
          [ABI41_0_0UMSharedApplication() registerForRemoteNotifications];
        });
      }
    } rejecter:^(NSString *code, NSString *message, NSError *error){
      [self _clearObserver];
      if (self.reject) {
        self.reject(code, message, error);
      }
    }];
  }
}

- (void)dealloc
{
  [self _clearObserver];
}

- (void)handleDidFinishRegisteringForRemoteNotifications
{
  [self _clearObserver];
  ABI41_0_0UM_WEAKIFY(self)
  dispatch_async(_methodQueue, ^{
    ABI41_0_0UM_STRONGIFY(self)
    [self _maybeConsumeResolverWithCurrentPermissions];
  });
}

- (void)_clearObserver
{
  [_permissionProgressPublisher removeDelegate:self];
  _remoteNotificationsRegistrationIsPending = NO;
}

- (void)_maybeConsumeResolverWithCurrentPermissions
{
  if (!_remoteNotificationsRegistrationIsPending) {
    if (_resolve) {
      _resolve([self getPermissions]);
      _resolve = nil;
      _reject = nil;
    }
  }
}

@end
