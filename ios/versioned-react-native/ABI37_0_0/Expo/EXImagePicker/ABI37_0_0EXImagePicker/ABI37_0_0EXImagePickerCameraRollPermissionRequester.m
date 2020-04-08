// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXImagePicker/ABI37_0_0EXImagePickerCameraRollPermissionRequester.h>

#import <Photos/Photos.h>

@implementation ABI37_0_0EXImagePickerCameraRollPermissionRequester

+ (NSString *)permissionType
{
  return @"cameraRoll";
}

- (NSDictionary *)getPermissions
{
  ABI37_0_0UMPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI37_0_0UMPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI37_0_0UMPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI37_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status),
    @"granted": @(status == ABI37_0_0UMPermissionStatusGranted)
  };
}

- (void)requestPermissionsWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  ABI37_0_0UM_WEAKIFY(self)
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    ABI37_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
