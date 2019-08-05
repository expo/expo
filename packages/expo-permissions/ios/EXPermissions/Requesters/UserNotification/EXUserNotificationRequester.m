// Copyright © 2018 650 Industries. All rights reserved.

#import <EXPermissions/EXUserNotificationRequester.h>
#import <UIKit/UIKit.h>
#import <EXPermissions/EXPermissions.h>
#import <UMPermissionsInterface/UMUserNotificationCenterProxyInterface.h>

@implementation EXUserNotificationRequester

- (id<UMUserNotificationCenterProxyInterface>)getNotificationCenter {
  return [[self.permissionsModule getModuleRegistry] getModuleImplementingProtocol:@protocol(UMUserNotificationCenterProxyInterface)];
}

- (NSDictionary *)permissions
{
  dispatch_assert_queue_not(dispatch_get_main_queue());
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block BOOL allowsSound;
  __block BOOL allowsAlert;
  __block BOOL allowsBadge;
  __block EXPermissionStatus status;

  [[self getNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    allowsSound = settings.soundSetting == UNNotificationSettingEnabled;
    allowsAlert = settings.alertSetting == UNNotificationSettingEnabled;
    allowsBadge = settings.badgeSetting == UNNotificationSettingEnabled;

    status = EXPermissionStatusUndetermined;

    if (settings.authorizationStatus == UNAuthorizationStatusAuthorized) {
      status = EXPermissionStatusGranted;
    } else if (settings.authorizationStatus == UNAuthorizationStatusDenied) {
      status = EXPermissionStatusDenied;
    } else {
      status = EXPermissionStatusUndetermined;
    }
    dispatch_semaphore_signal(sem);
  }];

  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);

  return @{
           @"status": [EXPermissions permissionStringForStatus:status],
           @"allowsSound": @(allowsSound),
           @"allowsAlert": @(allowsAlert),
           @"allowsBadge": @(allowsBadge),
           @"expires": EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  UM_WEAKIFY(self)
  
  UNAuthorizationOptions options = UNAuthorizationOptionAlert + UNAuthorizationOptionSound + UNAuthorizationOptionBadge;
  id<UMUserNotificationCenterProxyInterface> notificationCenter = [self getNotificationCenter];
  [notificationCenter requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
    UM_STRONGIFY(self)
    NSAssert(self.permissionsModule, @"Permissions module is required to properly consume result.");
    dispatch_async(self.permissionsModule.methodQueue, ^{
      if (error) {
        reject(@"E_PERM_REQ", error.description, error);
      } else {
        [self _consumeResolverWithCurrentPermissions:resolve];
      }
    });
  }];
}

- (void)_consumeResolverWithCurrentPermissions:(UMPromiseResolveBlock)resolver
{
  if (resolver) {
    resolver([self permissions]);
  }
  if (self.delegate) {
    [self.delegate permissionRequesterDidFinish:self];
  }
}

@end
