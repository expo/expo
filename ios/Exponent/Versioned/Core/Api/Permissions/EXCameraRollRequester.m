// Copyright 2017-present 650 Industries. All rights reserved.

#import "EXCameraRollRequester.h"

#import <Photos/Photos.h>

@interface EXCameraRollRequester ()

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXCameraRollRequester

+ (NSDictionary *)permissions
{
  EXPermissionStatus status;
  PHAuthorizationStatus permissions = [PHPhotoLibrary authorizationStatus];
  switch (permissions) {
    case PHAuthorizationStatusAuthorized:
      status = EXPermissionStatusGranted;
      break;
    case PHAuthorizationStatusDenied:
    case PHAuthorizationStatusRestricted:
      status = EXPermissionStatusDenied;
      break;
    case PHAuthorizationStatusNotDetermined:
      status = EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [EXPermissions permissionStringForStatus:status],
    @"expires": EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    NSDictionary *result = [[self class] permissions];
    resolve(result);
    if (_delegate) {
      [_delegate permissionsRequester:self didFinishWithResult:result];
    }
  }];
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
