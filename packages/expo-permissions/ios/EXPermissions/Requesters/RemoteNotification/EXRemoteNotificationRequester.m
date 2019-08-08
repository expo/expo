// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXRemoteNotificationRequester.h>
#import <UMCore/UMUtilities.h>
#import <EXPermissions/EXUserNotificationRequester.h>

NSString * const EXAppDidRegisterForRemoteNotificationsNotificationName = @"kEXAppDidRegisterForRemoteNotificationsNotification";

@interface EXRemoteNotificationRequester ()

@property (nonatomic, strong) UMPromiseResolveBlock resolve;
@property (nonatomic, strong) UMPromiseRejectBlock reject;
@property (nonatomic, assign) BOOL remoteNotificationsRegistrationIsPending;
@property (nonatomic, strong) EXUserNotificationRequester *localNotificationRequester;
@end

@implementation EXRemoteNotificationRequester

- (instancetype)init {
  if (self = [super init]) {
    _remoteNotificationsRegistrationIsPending = NO;
  }
  return self;
}

- (NSDictionary *)permissions
{
  __block EXPermissionStatus status;
  [UMUtilities performSynchronouslyOnMainThread:^{
    status = (UMSharedApplication().isRegisteredForRemoteNotifications) ?
    EXPermissionStatusGranted :
    EXPermissionStatusUndetermined;
  }];
  NSMutableDictionary *permissions = [[self.permissionsModule getPermissionsForResource:@"userFacingNotifications"] mutableCopy]; // get permissions for user notifications
  [permissions setValuesForKeysWithDictionary:@{
                                                @"status": [EXPermissions permissionStringForStatus:status],
                                                @"expires": EXPermissionExpiresNever,
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
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                                 name:EXAppDidRegisterForRemoteNotificationsNotificationName
                                               object:nil];
    id<EXPermissionRequester> requester = [self.permissionsModule getPermissionRequesterForType:@"userFacingNotifications"];
    UM_WEAKIFY(self)
    [requester requestPermissionsWithResolver:^(NSDictionary *permission){
      UM_STRONGIFY(self)
      self->_localNotificationRequester = nil;
      NSString *localNotificationsStatus = [permission objectForKey:@"status"];
      // We may assume that `EXLocalNotificationRequester`'s permission request will always finish
      // when the user responds to the dialog or has already responded in the past.
      // However, `UIApplication.registerForRemoteNotification` results in calling
      // `application:didRegisterForRemoteNotificationsWithDeviceToken:` or
      // `application:didFailToRegisterForRemoteNotificationsWithError:` on the application delegate
      // ONLY when the notifications are enabled in settings (by allowing sound, alerts or app badge).
      // So, when the local notifications are disabled, the application delegate's callbacks will not be called instantly.
      if ([localNotificationsStatus isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusDenied]]) {
        [self _clearObserver];
      }
      [self _maybeConsumeResolverWithCurrentPermissions];
    } rejecter:nil];
    _remoteNotificationsRegistrationIsPending = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
      [UMSharedApplication() registerForRemoteNotifications];
    });
  }
}

- (void)dealloc
{
  [self _clearObserver];
}

- (void)_handleDidRegisterForRemoteNotifications:(__unused NSNotification *)notif
{
  [self _clearObserver];
  NSAssert(self.permissionsModule, @"Permissions module is required to properly consume result.");
  UM_WEAKIFY(self)
  dispatch_async(self.permissionsModule.methodQueue, ^{
    UM_STRONGIFY(self)
    [self _maybeConsumeResolverWithCurrentPermissions];
  });
}

- (void)_clearObserver
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  _remoteNotificationsRegistrationIsPending = NO;
}

- (void)_maybeConsumeResolverWithCurrentPermissions
{
  if (_localNotificationRequester == nil && !_remoteNotificationsRegistrationIsPending) {
    if (_resolve) {
      _resolve([self permissions]);
      _resolve = nil;
      _reject = nil;
    }
  }
}

@end
