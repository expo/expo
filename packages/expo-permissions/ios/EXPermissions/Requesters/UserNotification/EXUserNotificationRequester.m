// Copyright © 2018 650 Industries. All rights reserved.

#import <EXPermissions/EXUserNotificationRequester.h>
#import <UIKit/UIKit.h>
#import <EXPermissions/EXPermissions.h>
#import <UMPermissionsInterface/UMUserNotificationCenterProxyInterface.h>

@interface EXUserNotificationRequester ()

@property (nonatomic, weak) id<UMUserNotificationCenterProxyInterface> notificationCenter;
@property (nonatomic, weak) dispatch_queue_t methodQueue;

@end

@implementation EXUserNotificationRequester

+ (NSString *)permissionType
{
  return @"userFacingNotifications";
}

- (instancetype)initWithNotificationProxy:(id<UMUserNotificationCenterProxyInterface>)proxy withMetodQueqe:(dispatch_queue_t)queue
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
  __block UMPermissionStatus status;

  [_notificationCenter getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    allowsSound = settings.soundSetting == UNNotificationSettingEnabled;
    allowsAlert = settings.alertSetting == UNNotificationSettingEnabled;
    allowsBadge = settings.badgeSetting == UNNotificationSettingEnabled;

    status = UMPermissionStatusUndetermined;

    if (settings.authorizationStatus == UNAuthorizationStatusAuthorized) {
      status = UMPermissionStatusGranted;
    } else if (settings.authorizationStatus == UNAuthorizationStatusDenied) {
      status = UMPermissionStatusDenied;
    } else {
      status = UMPermissionStatusUndetermined;
    }
    dispatch_semaphore_signal(sem);
  }];

  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);

  return @{
           @"status": @(status),
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
  [_notificationCenter requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
    UM_STRONGIFY(self)
    NSAssert(self->_methodQueue, @"Permissions module is required to properly consume result.");
    dispatch_async(self->_methodQueue, ^{
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
    resolver([self getPermissions]);
  }
}

@end
