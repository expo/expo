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
    @"granted": @(status == EXPermissionStatusGranted),
    @"expires": EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  UM_WEAKIFY(self)
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    UM_STRONGIFY(self)
    resolve([[self class] permissions]);
    if (self.delegate) {
      [self.delegate permissionRequesterDidFinish:self];
    }
  }];
}

@end
