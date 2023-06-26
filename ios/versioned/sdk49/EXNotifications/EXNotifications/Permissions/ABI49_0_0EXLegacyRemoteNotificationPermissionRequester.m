// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXNotifications/ABI49_0_0EXLegacyRemoteNotificationPermissionRequester.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXUtilities.h>

@interface ABI49_0_0EXLegacyRemoteNotificationPermissionRequester ()

@property (nonatomic, strong) ABI49_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI49_0_0EXPromiseRejectBlock reject;
@property (nonatomic, assign) BOOL remoteNotificationsRegistrationIsPending;
@property (nonatomic, weak) id<ABI49_0_0EXPermissionsRequester> userNotificationPermissionRequester;
@property (nonatomic, weak) dispatch_queue_t methodQueue;
@property (nonatomic, weak) id<ABI49_0_0EXRemoteNotificationPermissionProgressPublisher> permissionProgressPublisher;

@end

@implementation ABI49_0_0EXLegacyRemoteNotificationPermissionRequester

+ (NSString *)permissionType
{
  return @"notifications";
}

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI49_0_0EXPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<ABI49_0_0EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
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
  __block ABI49_0_0EXPermissionStatus status;
  [ABI49_0_0EXUtilities performSynchronouslyOnMainThread:^{
    status = (ABI49_0_0UMSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI49_0_0EXPermissionStatusGranted :
    ABI49_0_0EXPermissionStatusUndetermined;
  }];
  NSMutableDictionary *permissions = [[_userNotificationPermissionRequester getPermissions] mutableCopy];
  
  [permissions setValuesForKeysWithDictionary:@{
                                                @"status": @(status),

                                                }];
  return permissions;
}

- (void)requestPermissionsWithResolver:(ABI49_0_0EXPromiseResolveBlock)resolve rejecter:(ABI49_0_0EXPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;

  BOOL __block isRegisteredForRemoteNotifications = NO;
  [ABI49_0_0EXUtilities performSynchronouslyOnMainThread:^{
    isRegisteredForRemoteNotifications = ABI49_0_0UMSharedApplication().isRegisteredForRemoteNotifications;
  }];

  if (isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _maybeConsumeResolverWithCurrentPermissions];
  } else {
    [_permissionProgressPublisher addDelegate:self];
     ABI49_0_0EX_WEAKIFY(self)
    [_userNotificationPermissionRequester requestPermissionsWithResolver:^(NSDictionary *permission){
      ABI49_0_0EX_STRONGIFY(self)
      ABI49_0_0EXPermissionStatus localNotificationsStatus = [[permission objectForKey:@"status"] intValue];
      // We may assume that `ABI49_0_0EXLocalNotificationRequester`'s permission request will always finish
      // when the user responds to the dialog or has already responded in the past.
      // However, `UIApplication.registerForRemoteNotification` results in calling
      // `application:didRegisterForRemoteNotificationsWithDeviceToken:` or
      // `application:didFailToRegisterForRemoteNotificationsWithError:` on the application delegate
      // ONLY when the notifications are enabled in settings (by allowing sound, alerts or app badge).
      // So, when the local notifications are disabled, the application delegate's callbacks will not be called instantly.
      if (localNotificationsStatus == ABI49_0_0EXPermissionStatusDenied) {
        [self _clearObserver];
        [self _maybeConsumeResolverWithCurrentPermissions];
      } else {
        self.remoteNotificationsRegistrationIsPending = YES;
        dispatch_async(dispatch_get_main_queue(), ^{
          [ABI49_0_0UMSharedApplication() registerForRemoteNotifications];
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
  ABI49_0_0EX_WEAKIFY(self)
  dispatch_async(_methodQueue, ^{
    ABI49_0_0EX_STRONGIFY(self)
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
