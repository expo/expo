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
  EXPermissionStatus status;
  
  if (@available(iOS 14, *)) {
    ATTrackingManagerAuthorizationStatus systemStatus = [ATTrackingManager trackingAuthorizationStatus];
    switch (systemStatus) {
      case ATTrackingManagerAuthorizationStatusAuthorized:
        status = EXPermissionStatusGranted;
        break;
      case ATTrackingManagerAuthorizationStatusNotDetermined:
        status = EXPermissionStatusUndetermined;
        break;
      case ATTrackingManagerAuthorizationStatusRestricted:
      case ATTrackingManagerAuthorizationStatusDenied:
        status = EXPermissionStatusDenied;
        break;
    }
  } else {
    status = EXPermissionStatusGranted;
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
