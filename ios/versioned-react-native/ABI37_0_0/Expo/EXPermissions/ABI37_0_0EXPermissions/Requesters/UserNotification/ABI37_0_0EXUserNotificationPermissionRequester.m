// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI37_0_0EXPermissions/ABI37_0_0EXUserNotificationPermissionRequester.h>
#import <UIKit/UIKit.h>
#import <ABI37_0_0EXPermissions/ABI37_0_0EXPermissions.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI37_0_0EXUserNotificationPermissionRequester ()

@property (nonatomic, weak) id<ABI37_0_0UMUserNotificationCenterProxyInterface> notificationCenter;
@property (nonatomic, weak) dispatch_queue_t methodQueue;

@end

@implementation ABI37_0_0EXUserNotificationPermissionRequester

+ (NSString *)permissionType
{
  return @"userFacingNotifications";
}

- (instancetype)initWithNotificationProxy:(id<ABI37_0_0UMUserNotificationCenterProxyInterface>)proxy withMethodQueue:(dispatch_queue_t)queue
{
  if (self = [super init]){
    _notificationCenter = proxy;
    _methodQueue = queue;
  }
  return self;
}

- (NSDictionary *)getPermissions
{
  dispatch_assert_queue_not(dispatch_get_main_queue());
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block BOOL allowsSound;
  __block BOOL allowsAlert;
  __block BOOL allowsBadge;
  __block ABI37_0_0UMPermissionStatus status;

  [_notificationCenter getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    allowsSound = settings.soundSetting == UNNotificationSettingEnabled;
    allowsAlert = settings.alertSetting == UNNotificationSettingEnabled;
    allowsBadge = settings.badgeSetting == UNNotificationSettingEnabled;

    status = ABI37_0_0UMPermissionStatusUndetermined;

    if (settings.authorizationStatus == UNAuthorizationStatusAuthorized) {
      status = ABI37_0_0UMPermissionStatusGranted;
    } else if (settings.authorizationStatus == UNAuthorizationStatusDenied) {
      status = ABI37_0_0UMPermissionStatusDenied;
    } else {
      status = ABI37_0_0UMPermissionStatusUndetermined;
    }
    dispatch_semaphore_signal(sem);
  }];

  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);

  return @{
           @"status": @(status),
           @"allowsSound": @(allowsSound),
           @"allowsAlert": @(allowsAlert),
           @"allowsBadge": @(allowsBadge),
           };
}

- (void)requestPermissionsWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  UNAuthorizationOptions options = UNAuthorizationOptionAlert + UNAuthorizationOptionSound + UNAuthorizationOptionBadge;
  ABI37_0_0UM_WEAKIFY(self)
  [_notificationCenter requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
    ABI37_0_0UM_STRONGIFY(self)
    NSAssert(self->_methodQueue, @"Method queue is required to properly consume result.");
    dispatch_async(self->_methodQueue, ^{
      if (error) {
        reject(@"E_PERM_REQ", error.description, error);
      } else {
        [self _consumeResolverWithCurrentPermissions:resolve];
      }
    });
  }];
}

- (void)_consumeResolverWithCurrentPermissions:(ABI37_0_0UMPromiseResolveBlock)resolver
{
  if (resolver) {
    resolver([self getPermissions]);
  }
}

@end
