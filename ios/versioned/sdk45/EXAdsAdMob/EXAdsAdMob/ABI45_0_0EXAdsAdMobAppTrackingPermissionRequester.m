// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXAdsAdMob/ABI45_0_0EXAdsAdMobAppTrackingPermissionRequester.h>
#import <AppTrackingTransparency/ATTrackingManager.h>

@implementation ABI45_0_0EXAdsAdMobAppTrackingPermissionRequester

+ (NSString *)permissionType
{
  return @"appTracking";
}

- (NSDictionary *)getPermissions
{
  ABI45_0_0EXPermissionStatus status;
  
  if (@available(iOS 14, *)) {
    ATTrackingManagerAuthorizationStatus systemStatus = [ATTrackingManager trackingAuthorizationStatus];
    switch (systemStatus) {
      case ATTrackingManagerAuthorizationStatusAuthorized:
        status = ABI45_0_0EXPermissionStatusGranted;
        break;
      case ATTrackingManagerAuthorizationStatusNotDetermined:
        status = ABI45_0_0EXPermissionStatusUndetermined;
        break;
      case ATTrackingManagerAuthorizationStatusRestricted:
      case ATTrackingManagerAuthorizationStatusDenied:
        status = ABI45_0_0EXPermissionStatusDenied;
        break;
    }
  } else {
    status = ABI45_0_0EXPermissionStatusGranted;
  }
  
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI45_0_0EXPromiseResolveBlock)resolve rejecter:(ABI45_0_0EXPromiseRejectBlock)reject
{
  if (@available(iOS 14, *)) {
    ABI45_0_0EX_WEAKIFY(self)
    [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
      ABI45_0_0EX_STRONGIFY(self)
      resolve([self getPermissions]);
    }];
  } else {
    resolve([self getPermissions]);
  }
}

@end
