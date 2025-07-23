// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXUserFacingNotificationsPermissionsRequester.h>
#import <ExpoModulesCore/EXDefines.h>
#import <UserNotifications/UserNotifications.h>

@interface EXUserFacingNotificationsPermissionsRequester ()

@property (nonatomic, strong) dispatch_queue_t methodQueue;

@end

@implementation EXUserFacingNotificationsPermissionsRequester

+ (NSString *)permissionType
{
  return @"userFacingNotifications";
}

- (instancetype)init
{
  if (self = [super init]) {
    self.methodQueue = dispatch_queue_create("EXUserFacingNotificationsPermissionRequester", DISPATCH_QUEUE_SERIAL);
    self.authorizationOptions = UNAuthorizationOptionNone;
  }
  return self;
}

- (NSDictionary *)getPermissions
{
  dispatch_assert_queue_not(dispatch_get_main_queue());
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);

  __block NSMutableDictionary *status = [NSMutableDictionary dictionary];
  __block EXPermissionStatus generalStatus = EXPermissionStatusUndetermined;

  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    if (settings.authorizationStatus == UNAuthorizationStatusAuthorized) {
      generalStatus = EXPermissionStatusGranted;
    } else if (settings.authorizationStatus == UNAuthorizationStatusDenied) {
      generalStatus = EXPermissionStatusDenied;
    }

    status[@"status"] = [self authorizationStatusToEnum:settings.authorizationStatus];

    status[@"allowsDisplayInNotificationCenter"] = [self notificationSettingToNumber:settings.notificationCenterSetting] ?: [NSNull null];
    status[@"allowsDisplayOnLockScreen"] = [self notificationSettingToNumber:settings.lockScreenSetting] ?: [NSNull null];
    status[@"allowsDisplayInCarPlay"] = [self notificationSettingToNumber:settings.carPlaySetting] ?: [NSNull null];

    status[@"allowsAlert"] = [self notificationSettingToNumber:settings.alertSetting] ?: [NSNull null];
    status[@"allowsBadge"] = [self notificationSettingToNumber:settings.badgeSetting] ?: [NSNull null];
    status[@"allowsSound"] = [self notificationSettingToNumber:settings.soundSetting] ?: [NSNull null];
    status[@"allowsCriticalAlerts"] = [self notificationSettingToNumber:settings.criticalAlertSetting] ?: [NSNull null];
    status[@"alertStyle"] = [self alertStyleToEnum:settings.alertStyle];
    status[@"allowsPreviews"] = [self showPreviewsSettingToEnum:settings.showPreviewsSetting];
    status[@"providesAppNotificationSettings"] = @(settings.providesAppNotificationSettings);
    status[@"allowsAnnouncements"] = [self notificationSettingToNumber:settings.announcementSetting] ?: [NSNull null];

    dispatch_semaphore_signal(sem);
  }];

  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);

  return @{
           @"status": @(generalStatus),
           @"ios": status
           };
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  [self requestAuthorizationOptions:self.authorizationOptions withResolver:resolve rejecter:reject];
}

- (void)requestAuthorizationOptions:(UNAuthorizationOptions)options withResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  EX_WEAKIFY(self);
  [[UNUserNotificationCenter currentNotificationCenter] requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
    EX_ENSURE_STRONGIFY(self);
    // getPermissions blocks method queue on which this callback is being executed
    // so we have to dispatch to another queue.
    dispatch_async(self.methodQueue, ^{
      if (error) {
        reject(@"ERR_PERMISSIONS_REQUEST_NOTIFICATIONS", error.description, error);
      } else {
        resolve([self getPermissions]);
      }
    });
  }];
}

# pragma mark - Utilities - notification settings to string

- (NSNumber *)showPreviewsSettingToEnum:(UNShowPreviewsSetting)setting {
  switch (setting) {
    case UNShowPreviewsSettingNever:
      return @(0);
    case UNShowPreviewsSettingAlways:
      return @(1);
    case UNShowPreviewsSettingWhenAuthenticated:
      return @(2);
  }
}

- (NSNumber *)alertStyleToEnum:(UNAlertStyle)style {
  switch (style) {
    case UNAlertStyleNone:
      return @(0);
    case UNAlertStyleBanner:
      return @(1);
    case UNAlertStyleAlert:
      return @(2);
  }
}

- (NSNumber *)authorizationStatusToEnum:(UNAuthorizationStatus)status
{
  switch (status) {
    case UNAuthorizationStatusNotDetermined:
      return @(0);
    case UNAuthorizationStatusDenied:
      return @(1);
    case UNAuthorizationStatusAuthorized:
      return @(2);
    case UNAuthorizationStatusProvisional:
      return @(3);
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
    case UNAuthorizationStatusEphemeral:
      return @(4);
#endif
  }
}

- (nullable NSNumber *)notificationSettingToNumber:(UNNotificationSetting)setting
{
  switch (setting) {
    case UNNotificationSettingEnabled:
      return @(YES);
    case UNNotificationSettingDisabled:
      return @(NO);
    case UNNotificationSettingNotSupported:
      return nil;
  }
}

@end
