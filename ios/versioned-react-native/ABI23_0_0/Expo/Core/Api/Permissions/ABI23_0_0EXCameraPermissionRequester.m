// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXCameraPermissionRequester.h"
#import <ReactABI23_0_0/ABI23_0_0RCTUtils.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI23_0_0EXCameraPermissionRequester ()

@property (nonatomic, weak) id<ABI23_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI23_0_0EXCameraPermissionRequester

+ (NSDictionary *)permissions
{
  AVAuthorizationStatus systemStatus;
  ABI23_0_0EXPermissionStatus status;

  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI23_0_0RCTFatal(ABI23_0_0RCTErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI23_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied: case AVAuthorizationStatusRestricted:
      status = ABI23_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI23_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI23_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI23_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI23_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject
{
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    NSDictionary *result = [[self class] permissions];
    resolve(result);
    if (_delegate) {
      [_delegate permissionsRequester:self didFinishWithResult:result];
    }
  }];
}

- (void)setDelegate:(id<ABI23_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
