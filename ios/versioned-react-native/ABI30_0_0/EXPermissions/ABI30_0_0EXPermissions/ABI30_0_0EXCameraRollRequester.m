// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXPermissions/ABI30_0_0EXCameraRollRequester.h>

#import <Photos/Photos.h>

@interface ABI30_0_0EXCameraRollRequester ()

@property (nonatomic, weak) id<ABI30_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI30_0_0EXCameraRollRequester

+ (NSDictionary *)permissions
{
  ABI30_0_0EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI30_0_0EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI30_0_0EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI30_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI30_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI30_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI30_0_0EXPromiseResolveBlock)resolve rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI30_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
