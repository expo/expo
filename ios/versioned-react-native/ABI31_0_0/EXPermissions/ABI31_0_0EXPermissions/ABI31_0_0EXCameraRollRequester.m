// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXPermissions/ABI31_0_0EXCameraRollRequester.h>

#import <Photos/Photos.h>

@interface ABI31_0_0EXCameraRollRequester ()

@property (nonatomic, weak) id<ABI31_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI31_0_0EXCameraRollRequester

+ (NSDictionary *)permissions
{
  ABI31_0_0EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI31_0_0EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI31_0_0EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI31_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI31_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI31_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI31_0_0EXPromiseResolveBlock)resolve rejecter:(ABI31_0_0EXPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI31_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
