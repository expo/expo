// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebookAppTrackingPermissionRequester.h>
#import <AppTrackingTransparency/ATTrackingManager.h>

@implementation EXFacebookAppTrackingPermissionRequester

+ (NSString *)permissionType
{
  return @"appTracking";
}

- (NSDictionary *)getPermissions
{
  UMPermissionStatus status;
  
  if (@available(iOS 14, *)) {
    ATTrackingManagerAuthorizationStatus systemStatus = [ATTrackingManager trackingAuthorizationStatus];
    switch (systemStatus) {
      case ATTrackingManagerAuthorizationStatusAuthorized:
        status = UMPermissionStatusGranted;
        break;
      case ATTrackingManagerAuthorizationStatusNotDetermined:
        status = UMPermissionStatusUndetermined;
        break;
      case ATTrackingManagerAuthorizationStatusRestricted:
      case ATTrackingManagerAuthorizationStatusDenied:
        status = UMPermissionStatusDenied;
        break;
    }
  } else {
    status = UMPermissionStatusGranted;
  }
  
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  if (@available(iOS 14, *)) {
    UM_WEAKIFY(self)
    [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
      UM_STRONGIFY(self)
      resolve([self getPermissions]);
    }];
  } else {
    resolve([self getPermissions]);
  }
}

@end
