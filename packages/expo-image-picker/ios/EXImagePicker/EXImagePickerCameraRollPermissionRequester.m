// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXImagePicker/EXImagePickerCameraRollPermissionRequester.h>

#import <Photos/Photos.h>

@implementation EXImagePickerCameraRollPermissionRequester

+ (NSString *)permissionType
{
  return @"cameraRoll";
}

- (NSDictionary *)getPermissions
{
  UMPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = UMPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = UMPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status),
    @"granted": @(status == UMPermissionStatusGranted)
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  UM_WEAKIFY(self)
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
