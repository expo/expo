// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI35_0_0EXPermissions/ABI35_0_0EXUserNotificationRequester.h>
#import <UIKit/UIKit.h>
#import <ABI35_0_0EXPermissions/ABI35_0_0EXPermissions.h>
#import <ABI35_0_0UMPermissionsInterface/ABI35_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI35_0_0EXUserNotificationRequester ()

@property (nonatomic, weak) id<ABI35_0_0EXPermissionRequesterDelegate> delegate;
@property (nonatomic, weak) ABI35_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI35_0_0EXUserNotificationRequester

- (instancetype)initWithModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry {
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

+ (id<ABI35_0_0UMUserNotificationCenterProxyInterface>)getCenterWithModuleRegistry:(ABI35_0_0UMModuleRegistry *) moduleRegistry {
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI35_0_0UMUserNotificationCenterProxyInterface)];
}

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry
{
  dispatch_assert_queue_not(dispatch_get_main_queue());
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block BOOL allowsSound;
  __block BOOL allowsAlert;
  __block BOOL allowsBadge;
  __block ABI35_0_0EXPermissionStatus status;

  [[ABI35_0_0EXUserNotificationRequester getCenterWithModuleRegistry:moduleRegistry] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
    allowsSound = settings.soundSetting == UNNotificationSettingEnabled;
    allowsAlert = settings.alertSetting == UNNotificationSettingEnabled;
    allowsBadge = settings.badgeSetting == UNNotificationSettingEnabled;

    status = ABI35_0_0EXPermissionStatusUndetermined;

    if (settings.authorizationStatus == UNAuthorizationStatusAuthorized) {
      status = ABI35_0_0EXPermissionStatusGranted;
    } else if (settings.authorizationStatus == UNAuthorizationStatusDenied) {
      status = ABI35_0_0EXPermissionStatusDenied;
    } else {
      status = ABI35_0_0EXPermissionStatusUndetermined;
    }
    dispatch_semaphore_signal(sem);
  }];

  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);

  return @{
           @"status": [ABI35_0_0EXPermissions permissionStringForStatus:status],
           @"allowsSound": @(allowsSound),
           @"allowsAlert": @(allowsAlert),
           @"allowsBadge": @(allowsBadge),
           @"expires": ABI35_0_0EXPermissionExpiresNever,
           };
}

- (void)setDelegate:(id<ABI35_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

- (void)requestPermissionsWithResolver:(ABI35_0_0UMPromiseResolveBlock)resolve rejecter:(ABI35_0_0UMPromiseRejectBlock)reject
{
  __weak ABI35_0_0EXUserNotificationRequester *weakSelf = self;

  UNAuthorizationOptions options = UNAuthorizationOptionAlert + UNAuthorizationOptionSound + UNAuthorizationOptionBadge;
  id<ABI35_0_0UMUserNotificationCenterProxyInterface> notificationCenter = [ABI35_0_0EXUserNotificationRequester getCenterWithModuleRegistry:_moduleRegistry];
  [notificationCenter requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
    id<ABI35_0_0EXPermissionsModule> permissionsModule = [weakSelf.moduleRegistry getModuleImplementingProtocol:@protocol(ABI35_0_0EXPermissionsModule)];
    NSAssert(permissionsModule, @"Permissions module is required to properly consume result.");
    dispatch_async(permissionsModule.methodQueue, ^{
      if (error) {
        reject(@"E_PERM_REQ", error.description, error);
      } else {
        [weakSelf _consumeResolverWithCurrentPermissions:resolve];
      }
    });
  }];
}

- (void)_consumeResolverWithCurrentPermissions:(ABI35_0_0UMPromiseResolveBlock)resolver
{
  if (resolver) {
    resolver([[self class] permissionsWithModuleRegistry:_moduleRegistry]);
  }
  if (_delegate) {
    [_delegate permissionRequesterDidFinish:self];
  }
}

@end
