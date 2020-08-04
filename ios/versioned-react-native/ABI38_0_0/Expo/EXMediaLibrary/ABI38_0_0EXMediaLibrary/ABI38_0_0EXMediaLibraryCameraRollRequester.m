// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXMediaLibrary/ABI38_0_0EXMediaLibraryCameraRollRequester.h>

#import <Photos/Photos.h>

@implementation ABI38_0_0EXMediaLibraryCameraRollRequester

+ (NSString *)permissionType
{
  return @"cameraRoll";
}

- (NSDictionary *)getPermissions
{
  ABI38_0_0UMPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI38_0_0UMPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI38_0_0UMPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI38_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status),
    @"granted": @(status == ABI38_0_0UMPermissionStatusGranted)
  };
}

- (void)requestPermissionsWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve rejecter:(ABI38_0_0UMPromiseRejectBlock)reject
{
  ABI38_0_0UM_WEAKIFY(self)
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    ABI38_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
