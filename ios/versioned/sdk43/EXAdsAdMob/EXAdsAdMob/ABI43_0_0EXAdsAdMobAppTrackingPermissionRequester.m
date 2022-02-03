// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobAppTrackingPermissionRequester.h>
#import <AppTrackingTransparency/ATTrackingManager.h>

@implementation ABI43_0_0EXAdsAdMobAppTrackingPermissionRequester

+ (NSString *)permissionType
{
  return @"appTracking";
}

- (NSDictionary *)getPermissions
{
  ABI43_0_0EXPermissionStatus status;
  
  if (@available(iOS 14, *)) {
    ATTrackingManagerAuthorizationStatus systemStatus = [ATTrackingManager trackingAuthorizationStatus];
    switch (systemStatus) {
      case ATTrackingManagerAuthorizationStatusAuthorized:
        status = ABI43_0_0EXPermissionStatusGranted;
        break;
      case ATTrackingManagerAuthorizationStatusNotDetermined:
        status = ABI43_0_0EXPermissionStatusUndetermined;
        break;
      case ATTrackingManagerAuthorizationStatusRestricted:
      case ATTrackingManagerAuthorizationStatusDenied:
        status = ABI43_0_0EXPermissionStatusDenied;
        break;
    }
  } else {
    status = ABI43_0_0EXPermissionStatusGranted;
  }
  
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject
{
  if (@available(iOS 14, *)) {
    ABI43_0_0EX_WEAKIFY(self)
    [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
      ABI43_0_0EX_STRONGIFY(self)
      resolve([self getPermissions]);
    }];
  } else {
    resolve([self getPermissions]);
  }
}

@end
