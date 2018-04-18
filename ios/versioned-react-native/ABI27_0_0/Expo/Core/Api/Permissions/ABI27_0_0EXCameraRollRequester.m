// Copyright 2017-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXCameraRollRequester.h"

#import <Photos/Photos.h>

@interface ABI27_0_0EXCameraRollRequester ()

@property (nonatomic, weak) id<ABI27_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI27_0_0EXCameraRollRequester

+ (NSDictionary *)permissions
{
  ABI27_0_0EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI27_0_0EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI27_0_0EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI27_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI27_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI27_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI27_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    NSDictionary *result = [[self class] permissions];
    resolve(result);
    if (_delegate) {
      [_delegate permissionsRequester:self didFinishWithResult:result];
    }
  }];
}

- (void)setDelegate:(id<ABI27_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
