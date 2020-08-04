// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXNotifications/EXLegacyRemoteNotificationPermissionRequester.h>
#import <UMCore/UMUtilities.h>

@interface EXLegacyRemoteNotificationPermissionRequester ()

@property (nonatomic, strong) UMPromiseResolveBlock resolve;
@property (nonatomic, strong) UMPromiseRejectBlock reject;
@property (nonatomic, assign) BOOL remoteNotificationsRegistrationIsPending;
@property (nonatomic, weak) id<UMPermissionsRequester> userNotificationPermissionRequester;
@property (nonatomic, weak) dispatch_queue_t methodQueue;
@property (nonatomic, weak) id<EXRemoteNotificationPermissionProgressPublisher> permissionProgressPublisher;

@end

@implementation EXLegacyRemoteNotificationPermissionRequester

+ (NSString *)permissionType
{
  return @"notifications";
}

- (instancetype)initWithUserNotificationPermissionRequester:(id<UMPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
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
  __block UMPermissionStatus status;
  [UMUtilities performSynchronouslyOnMainThread:^{
    status = (UMSharedApplication().isRegisteredForRemoteNotifications) ?
    UMPermissionStatusGranted :
    UMPermissionStatusUndetermined;
  }];
  NSMutableDictionary *permissions = [[_userNotificationPermissionRequester getPermissions] mutableCopy];
  
  [permissions setValuesForKeysWithDictionary:@{
                                                @"status": @(status),

                                                }];
  return permissions;
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;

  BOOL __block isRegisteredForRemoteNotifications = NO;
  [UMUtilities performSynchronouslyOnMainThread:^{
    isRegisteredForRemoteNotifications = UMSharedApplication().isRegisteredForRemoteNotifications;
  }];

  if (isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _maybeConsumeResolverWithCurrentPermissions];
  } else {
    [_permissionProgressPublisher addDelegate:self];
     UM_WEAKIFY(self)
    [_userNotificationPermissionRequester requestPermissionsWithResolver:^(NSDictionary *permission){
      UM_STRONGIFY(self)
      UMPermissionStatus localNotificationsStatus = [[permission objectForKey:@"status"] intValue];
      // We may assume that `EXLocalNotificationRequester`'s permission request will always finish
      // when the user responds to the dialog or has already responded in the past.
      // However, `UIApplication.registerForRemoteNotification` results in calling
      // `application:didRegisterForRemoteNotificationsWithDeviceToken:` or
      // `application:didFailToRegisterForRemoteNotificationsWithError:` on the application delegate
      // ONLY when the notifications are enabled in settings (by allowing sound, alerts or app badge).
      // So, when the local notifications are disabled, the application delegate's callbacks will not be called instantly.
      if (localNotificationsStatus == UMPermissionStatusDenied) {
        [self _clearObserver];
        [self _maybeConsumeResolverWithCurrentPermissions];
      } else {
        self.remoteNotificationsRegistrationIsPending = YES;
        dispatch_async(dispatch_get_main_queue(), ^{
          [UMSharedApplication() registerForRemoteNotifications];
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
  UM_WEAKIFY(self)
  dispatch_async(_methodQueue, ^{
    UM_STRONGIFY(self)
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
