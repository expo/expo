// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI14_0_0EXAVPermissionRequester.h"
#import <ReactABI14_0_0/ABI14_0_0RCTUtils.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI14_0_0EXAVPermissionRequester ()

@property (nonatomic, weak) id<ABI14_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI14_0_0EXAVPermissionRequester

+ (NSDictionary *)permissions
{
  AVAuthorizationStatus systemStatus;
  ABI14_0_0EXPermissionStatus status;

  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI14_0_0RCTFatal(ABI14_0_0RCTErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI14_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied: case AVAuthorizationStatusRestricted:
      status = ABI14_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI14_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI14_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI14_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI14_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject
{
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI14_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
