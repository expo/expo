// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXImagePicker/ABI36_0_0EXImagePickerCameraRollPermissionRequester.h>

#import <Photos/Photos.h>

@implementation ABI36_0_0EXImagePickerCameraRollPermissionRequester

+ (NSString *)permissionType
{
  return @"cameraRoll";
}

- (NSDictionary *)getPermissions
{
  ABI36_0_0UMPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI36_0_0UMPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI36_0_0UMPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI36_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status),
    @"granted": @(status == ABI36_0_0UMPermissionStatusGranted)
  };
}

- (void)requestPermissionsWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve rejecter:(ABI36_0_0UMPromiseRejectBlock)reject
{
  ABI36_0_0UM_WEAKIFY(self)
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    ABI36_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
