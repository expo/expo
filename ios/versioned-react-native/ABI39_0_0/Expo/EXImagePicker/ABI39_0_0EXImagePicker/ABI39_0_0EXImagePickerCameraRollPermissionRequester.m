// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXImagePicker/ABI39_0_0EXImagePickerCameraRollPermissionRequester.h>

#import <Photos/Photos.h>

@implementation ABI39_0_0EXImagePickerCameraRollPermissionRequester

+ (NSString *)permissionType
{
  return @"cameraRoll";
}

- (NSDictionary *)getPermissions
{
  ABI39_0_0UMPermissionStatus status;
  NSString *scope;

  PHAuthorizationStatus permissions;
#ifdef __IPHONE_14_0
  if (@available(iOS 14, *)) {
    permissions = [PHPhotoLibrary authorizationStatusForAccessLevel:PHAccessLevelReadWrite];
  } else {
    permissions = [PHPhotoLibrary authorizationStatus];
  }
#else
  permissions = [PHPhotoLibrary authorizationStatus];
#endif

  switch (permissions) {
     case PHAuthorizationStatusAuthorized:
       status = ABI39_0_0UMPermissionStatusGranted;
       scope = @"all";
       break;
#ifdef __IPHONE_14_0
     case PHAuthorizationStatusLimited:
       status = ABI39_0_0UMPermissionStatusGranted;
       scope = @"limited";
       break;
#endif
     case PHAuthorizationStatusDenied:
     case PHAuthorizationStatusRestricted:
       status = ABI39_0_0UMPermissionStatusDenied;
       scope = @"none";
       break;
     case PHAuthorizationStatusNotDetermined:
       status = ABI39_0_0UMPermissionStatusUndetermined;
       scope = @"none";
       break;
  }

  return @{
    @"status": @(status),
    @"accessPrivileges": scope,
    @"granted": @(status == ABI39_0_0UMPermissionStatusGranted)
  };
}

- (void)requestPermissionsWithResolver:(ABI39_0_0UMPromiseResolveBlock)resolve rejecter:(ABI39_0_0UMPromiseRejectBlock)reject
{
  ABI39_0_0UM_WEAKIFY(self)
  void(^handler)(PHAuthorizationStatus) = ^(PHAuthorizationStatus status) {
    ABI39_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  };
  
#ifdef __IPHONE_14_0
  if (@available(iOS 14, *)) {
    [PHPhotoLibrary requestAuthorizationForAccessLevel:PHAccessLevelReadWrite handler:handler];
  } else {
    [PHPhotoLibrary requestAuthorization:handler];
  }
#else
  [PHPhotoLibrary requestAuthorization:handler];
#endif
}

@end
