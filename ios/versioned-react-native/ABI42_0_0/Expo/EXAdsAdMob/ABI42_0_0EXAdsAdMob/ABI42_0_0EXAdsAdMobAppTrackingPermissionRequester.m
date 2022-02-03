// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXAdsAdMob/ABI42_0_0EXAdsAdMobAppTrackingPermissionRequester.h>
#import <AppTrackingTransparency/ATTrackingManager.h>

@implementation ABI42_0_0EXAdsAdMobAppTrackingPermissionRequester

+ (NSString *)permissionType
{
  return @"appTracking";
}

- (NSDictionary *)getPermissions
{
  ABI42_0_0EXPermissionStatus status;
  
  if (@available(iOS 14, *)) {
    ATTrackingManagerAuthorizationStatus systemStatus = [ATTrackingManager trackingAuthorizationStatus];
    switch (systemStatus) {
      case ATTrackingManagerAuthorizationStatusAuthorized:
        status = ABI42_0_0EXPermissionStatusGranted;
        break;
      case ATTrackingManagerAuthorizationStatusNotDetermined:
        status = ABI42_0_0EXPermissionStatusUndetermined;
        break;
      case ATTrackingManagerAuthorizationStatusRestricted:
      case ATTrackingManagerAuthorizationStatusDenied:
        status = ABI42_0_0EXPermissionStatusDenied;
        break;
    }
  } else {
    status = ABI42_0_0EXPermissionStatusGranted;
  }
  
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (@available(iOS 14, *)) {
    ABI42_0_0UM_WEAKIFY(self)
    [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
      ABI42_0_0UM_STRONGIFY(self)
      resolve([self getPermissions]);
    }];
  } else {
    resolve([self getPermissions]);
  }
}

@end
