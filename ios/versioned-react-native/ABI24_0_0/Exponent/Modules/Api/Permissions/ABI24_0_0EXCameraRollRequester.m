// Copyright 2017-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXCameraRollRequester.h"

#import <Photos/Photos.h>

@interface ABI24_0_0EXCameraRollRequester ()

@property (nonatomic, weak) id<ABI24_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI24_0_0EXCameraRollRequester

+ (NSDictionary *)permissions
{
  ABI24_0_0EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = ABI24_0_0EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = ABI24_0_0EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = ABI24_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI24_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI24_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI24_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    resolve([[self class] permissions]);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI24_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
