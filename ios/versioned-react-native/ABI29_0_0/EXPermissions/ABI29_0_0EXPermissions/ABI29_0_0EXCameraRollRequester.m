// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXPermissions/ABI29_0_0EXCameraRollRequester.h>

#import <Photos/Photos.h>

@interface ABI29_0_0EXCameraRollRequester ()

@property (nonatomic, weak) id<ABI29_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI29_0_0EXCameraRollRequester

+ (NSDictionary *)permissions
{
  ABI29_0_0EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI29_0_0EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI29_0_0EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI29_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI29_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI29_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI29_0_0EXPromiseResolveBlock)resolve rejecter:(ABI29_0_0EXPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI29_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
