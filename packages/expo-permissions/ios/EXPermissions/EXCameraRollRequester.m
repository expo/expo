// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXPermissions/EXCameraRollRequester.h>

#import <Photos/Photos.h>

@implementation EXCameraRollRequester

+ (NSDictionary *)permissions
{
  EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [EXPermissions permissionStringForStatus:status],
    @"expires": EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    resolve([[self class] permissions]);
    if (self.delegate) {
      [self.delegate permissionRequesterDidFinish:self];
    }
  }];
}

@end
