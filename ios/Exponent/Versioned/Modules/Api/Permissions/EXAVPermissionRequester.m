// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXAVPermissionRequester.h"

#import <AVFoundation/AVFoundation.h>

@interface EXAVPermissionRequester ()

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXAVPermissionRequester

+ (NSDictionary *)permissions
{
  AVAuthorizationStatus systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  EXPermissionStatus status;
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied: case AVAuthorizationStatusRestricted:
      status = EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
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
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
