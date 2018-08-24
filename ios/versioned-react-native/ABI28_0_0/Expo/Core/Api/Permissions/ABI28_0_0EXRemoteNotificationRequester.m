// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXRemoteNotificationRequester.h"
#import "ABI28_0_0EXLocalNotificationRequester.h"
#import "ABI28_0_0EXUnversioned.h"

#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>

@interface ABI28_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI28_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI28_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI28_0_0EXPermissionRequesterDelegate> delegate;
@property (nonatomic, assign) BOOL remoteNotificationsRegistrationIsPending;
@property (nonatomic, strong) ABI28_0_0EXLocalNotificationRequester *localNotificationRequester;

@end

@implementation ABI28_0_0EXRemoteNotificationRequester

- (instancetype)init {
  if (self = [super init]) {
    _remoteNotificationsRegistrationIsPending = NO;
  }
  return self;
}

+ (NSDictionary *)permissions
{
  ABI28_0_0EXPermissionStatus status = (ABI28_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI28_0_0EXPermissionStatusGranted :
    ABI28_0_0EXPermissionStatusUndetermined;
  NSMutableDictionary *permissions = [[ABI28_0_0EXLocalNotificationRequester permissions] mutableCopy];
  // In order to receive a device token, we need to have permission for user-facing notifications
  if (status != ABI28_0_0EXPermissionStatusGranted) {
    permissions[@"status"] = [ABI28_0_0EXPermissions permissionStringForStatus:status];
  }
  permissions[@"expires"] = ABI28_0_0EXPermissionExpiresNever;
  return permissions;
}

- (void)requestPermissionsWithResolver:(ABI28_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;
  
  if (ABI28_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _maybeConsumeResolverWithCurrentPermissions];
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                                 name:@"kEXAppDidRegisterForRemoteNotificationsNotification"
                                               object:nil];
    _localNotificationRequester = [[ABI28_0_0EXLocalNotificationRequester alloc] init];
    [_localNotificationRequester setDelegate:self];
    [_localNotificationRequester requestPermissionsWithResolver:nil rejecter:nil];
    _remoteNotificationsRegistrationIsPending = YES;
    [ABI28_0_0RCTSharedApplication() registerForRemoteNotifications];
  }
}

- (void)setDelegate:(id<ABI28_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

- (void)_handleDidRegisterForRemoteNotifications:(__unused NSNotification *)notif
{
  [self _clearObserver];
  [self _maybeConsumeResolverWithCurrentPermissions];
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
      _resolve([[self class] permissions]);
      _resolve = nil;
      _reject = nil;
    }
    if (_delegate) {
      [_delegate permissionsRequester:self didFinishWithResult:nil];
    }
  }
}

# pragma mark - ABI28_0_0EXPermissionRequesterDelegate

- (void)permissionsRequester:(NSObject<ABI28_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult
{
  if (requester == _localNotificationRequester) {
    _localNotificationRequester = nil;
    NSString *localNotificationsStatus = [[ABI28_0_0EXLocalNotificationRequester permissions] objectForKey:@"status"];
    // We may assume that `ABI28_0_0EXLocalNotificationRequester`'s permission request will always finish
    // when the user responds to the dialog or has already responded in the past.
    // However, `UIApplication.registerForRemoteNotification` results in calling
    // `application:didRegisterForRemoteNotificationsWithDeviceToken:` or
    // `application:didFailToRegisterForRemoteNotificationsWithError:` on the application delegate
    // ONLY when the notifications are enabled in settings (by allowing sound, alerts or app badge).
    // So, when the local notifications are disabled, the application delegate's callbacks will not be called instantly.
    if ([localNotificationsStatus isEqualToString:[ABI28_0_0EXPermissions permissionStringForStatus:ABI28_0_0EXPermissionStatusDenied]]) {
      [self _clearObserver];
    }
    [self _maybeConsumeResolverWithCurrentPermissions];
  }
}

@end
