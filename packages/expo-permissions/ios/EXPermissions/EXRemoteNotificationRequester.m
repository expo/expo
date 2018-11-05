// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXRemoteNotificationRequester.h>
#import <EXPermissions/EXLocalNotificationRequester.h>

NSString * const EXAppDidRegisterForRemoteNotificationsNotificationName = @"kEXAppDidRegisterForRemoteNotificationsNotification";

@interface EXRemoteNotificationRequester ()

@property (nonatomic, strong) EXPromiseResolveBlock resolve;
@property (nonatomic, strong) EXPromiseRejectBlock reject;
@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;
@property (nonatomic, assign) BOOL remoteNotificationsRegistrationIsPending;
@property (nonatomic, strong) EXLocalNotificationRequester *localNotificationRequester;

@end

@implementation EXRemoteNotificationRequester

- (instancetype)init {
  if (self = [super init]) {
    _remoteNotificationsRegistrationIsPending = NO;
  }
  return self;
}

+ (NSDictionary *)permissions
{
  EXPermissionStatus status = (EXSharedApplication().isRegisteredForRemoteNotifications) ?
    EXPermissionStatusGranted :
    EXPermissionStatusUndetermined;
  NSMutableDictionary *permissions = [[EXLocalNotificationRequester permissions] mutableCopy];
  [permissions setValuesForKeysWithDictionary:@{
                                                @"status": [EXPermissions permissionStringForStatus:status],
                                                @"expires": EXPermissionExpiresNever,
                                                }];
  return permissions;
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;
  
  if (EXSharedApplication().isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _maybeConsumeResolverWithCurrentPermissions];
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                                 name:EXAppDidRegisterForRemoteNotificationsNotificationName
                                               object:nil];
    _localNotificationRequester = [[EXLocalNotificationRequester alloc] init];
    [_localNotificationRequester setDelegate:self];
    [_localNotificationRequester requestPermissionsWithResolver:nil rejecter:nil];
    _remoteNotificationsRegistrationIsPending = YES;
    [EXSharedApplication() registerForRemoteNotifications];
  }
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
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

# pragma mark - EXPermissionRequesterDelegate

- (void)permissionRequesterDidFinish:(NSObject<EXPermissionRequester> *)requester
{
  if (requester == _localNotificationRequester) {
    _localNotificationRequester = nil;
    NSString *localNotificationsStatus = [[EXLocalNotificationRequester permissions] objectForKey:@"status"];
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
  }
}

@end
