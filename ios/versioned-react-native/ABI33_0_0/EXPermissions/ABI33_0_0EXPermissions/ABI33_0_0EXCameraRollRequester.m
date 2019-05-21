// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXPermissions/ABI33_0_0EXCameraRollRequester.h>

#import <Photos/Photos.h>

@interface ABI33_0_0EXCameraRollRequester ()

@property (nonatomic, weak) id<ABI33_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI33_0_0EXCameraRollRequester

+ (NSDictionary *)permissions
{
  ABI33_0_0EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI33_0_0EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI33_0_0EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI33_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI33_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI33_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI33_0_0UMPromiseResolveBlock)resolve rejecter:(ABI33_0_0UMPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI33_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
