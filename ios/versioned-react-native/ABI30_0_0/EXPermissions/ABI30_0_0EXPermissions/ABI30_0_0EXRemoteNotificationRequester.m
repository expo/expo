// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXPermissions/ABI30_0_0EXRemoteNotificationRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXLocalNotificationRequester.h>

NSString * const ABI30_0_0EXAppDidRegisterForRemoteNotificationsNotificationName = @"kEXAppDidRegisterForRemoteNotificationsNotification";

@interface ABI30_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI30_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI30_0_0EXPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI30_0_0EXPermissionRequesterDelegate> delegate;
@property (nonatomic, assign) BOOL remoteNotificationsRegistrationIsPending;
@property (nonatomic, strong) ABI30_0_0EXLocalNotificationRequester *localNotificationRequester;

@end

@implementation ABI30_0_0EXRemoteNotificationRequester

- (instancetype)init {
  if (self = [super init]) {
    _remoteNotificationsRegistrationIsPending = NO;
  }
  return self;
}

+ (NSDictionary *)permissions
{
  ABI30_0_0EXPermissionStatus status = (ABI30_0_0EXSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI30_0_0EXPermissionStatusGranted :
    ABI30_0_0EXPermissionStatusUndetermined;
  NSMutableDictionary *permissions = [[ABI30_0_0EXLocalNotificationRequester permissions] mutableCopy];
  [permissions setValuesForKeysWithDictionary:@{
                                                @"status": [ABI30_0_0EXPermissions permissionStringForStatus:status],
                                                @"expires": ABI30_0_0EXPermissionExpiresNever,
                                                }];
  return permissions;
}

- (void)requestPermissionsWithResolver:(ABI30_0_0EXPromiseResolveBlock)resolve rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;
  
  if (ABI30_0_0EXSharedApplication().isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _maybeConsumeResolverWithCurrentPermissions];
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                                 name:ABI30_0_0EXAppDidRegisterForRemoteNotificationsNotificationName
                                               object:nil];
    _localNotificationRequester = [[ABI30_0_0EXLocalNotificationRequester alloc] init];
    [_localNotificationRequester setDelegate:self];
    [_localNotificationRequester requestPermissionsWithResolver:nil rejecter:nil];
    _remoteNotificationsRegistrationIsPending = YES;
    [ABI30_0_0EXSharedApplication() registerForRemoteNotifications];
  }
}

- (void)setDelegate:(id<ABI30_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

- (void)dealloc
{
  [self _clearObserver];
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
      [_delegate permissionRequesterDidFinish:self];
    }
  }
}

# pragma mark - ABI30_0_0EXPermissionRequesterDelegate

- (void)permissionRequesterDidFinish:(NSObject<ABI30_0_0EXPermissionRequester> *)requester
{
  if (requester == _localNotificationRequester) {
    _localNotificationRequester = nil;
    NSString *localNotificationsStatus = [[ABI30_0_0EXLocalNotificationRequester permissions] objectForKey:@"status"];
    // We may assume that `ABI30_0_0EXLocalNotificationRequester`'s permission request will always finish
    // when the user responds to the dialog or has already responded in the past.
    // However, `UIApplication.registerForRemoteNotification` results in calling
    // `application:didRegisterForRemoteNotificationsWithDeviceToken:` or
    // `application:didFailToRegisterForRemoteNotificationsWithError:` on the application delegate
    // ONLY when the notifications are enabled in settings (by allowing sound, alerts or app badge).
    // So, when the local notifications are disabled, the application delegate's callbacks will not be called instantly.
    if ([localNotificationsStatus isEqualToString:[ABI30_0_0EXPermissions permissionStringForStatus:ABI30_0_0EXPermissionStatusDenied]]) {
      [self _clearObserver];
    }
    [self _maybeConsumeResolverWithCurrentPermissions];
  }
}

@end
