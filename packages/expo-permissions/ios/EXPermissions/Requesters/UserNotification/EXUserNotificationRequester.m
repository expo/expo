// Copyright © 2018 650 Industries. All rights reserved.

#import <EXPermissions/EXUserNotificationRequester.h>
#import <UIKit/UIKit.h>
#import <EXPermissions/EXPermissions.h>
#import <UMPermissionsInterface/UMUserNotificationCenterProxyInterface.h>

@interface EXUserNotificationRequester ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXUserNotificationRequester

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry {
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

+ (id<UMUserNotificationCenterProxyInterface>)getCenterWithModuleRegistry:(UMModuleRegistry *) moduleRegistry {
  return [moduleRegistry getModuleImplementingProtocol:@protocol(UMUserNotificationCenterProxyInterface)];
}

+ (NSDictionary *)permissionsWithModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  dispatch_assert_queue_not(dispatch_get_main_queue());
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block BOOL allowsSound;
  __block BOOL allowsAlert;
  __block BOOL allowsBadge;
  __block EXPermissionStatus status;

  [[EXUserNotificationRequester getCenterWithModuleRegistry:moduleRegistry] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
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
  id<UMUserNotificationCenterProxyInterface> notificationCenter = [EXUserNotificationRequester getCenterWithModuleRegistry:_moduleRegistry];
  [notificationCenter requestAuthorizationWithOptions:options completionHandler:^(BOOL granted, NSError * _Nullable error) {
    UM_STRONGIFY(self)
    id<EXPermissionsModule> permissionsModule = [self.moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsModule)];
    NSAssert(permissionsModule, @"Permissions module is required to properly consume result.");
    dispatch_async(permissionsModule.methodQueue, ^{
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
    resolver([[self class] permissionsWithModuleRegistry:_moduleRegistry]);
  }
  if (self.delegate) {
    [self.delegate permissionRequesterDidFinish:self];
  }
}

@end
