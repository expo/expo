// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXTrackingTransparency/ABI44_0_0EXTrackingPermissionRequester.h>
#import <AppTrackingTransparency/ATTrackingManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI44_0_0EXTrackingPermissionRequester

+ (NSString *)permissionType
{
  return @"appTracking";
}

- (NSDictionary *)getPermissions
{
  ABI44_0_0EXPermissionStatus status;
  
  if (@available(iOS 14, *)) {
    ATTrackingManagerAuthorizationStatus systemStatus = [ATTrackingManager trackingAuthorizationStatus];
    switch (systemStatus) {
      case ATTrackingManagerAuthorizationStatusAuthorized:
        status = ABI44_0_0EXPermissionStatusGranted;
        break;
      case ATTrackingManagerAuthorizationStatusNotDetermined:
        status = ABI44_0_0EXPermissionStatusUndetermined;
        break;
      case ATTrackingManagerAuthorizationStatusRestricted:
      case ATTrackingManagerAuthorizationStatusDenied:
        status = ABI44_0_0EXPermissionStatusDenied;
        break;
    }
  } else {
    status = ABI44_0_0EXPermissionStatusGranted;
  }
  
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve rejecter:(ABI44_0_0EXPromiseRejectBlock)reject
{
  if (@available(iOS 14, *)) {
    ABI44_0_0EX_WEAKIFY(self)
    [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
      ABI44_0_0EX_STRONGIFY(self)
      resolve([self getPermissions]);
    }];
  } else {
    resolve([self getPermissions]);
  }
}

@end

NS_ASSUME_NONNULL_END
