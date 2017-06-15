// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXCameraPermissionRequester.h"
#import <ReactABI18_0_0/ABI18_0_0RCTUtils.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI18_0_0EXCameraPermissionRequester ()

@property (nonatomic, weak) id<ABI18_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI18_0_0EXCameraPermissionRequester

+ (NSDictionary *)permissions
{
  AVAuthorizationStatus systemStatus;
  ABI18_0_0EXPermissionStatus status;

  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI18_0_0RCTFatal(ABI18_0_0RCTErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI18_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied: case AVAuthorizationStatusRestricted:
      status = ABI18_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI18_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI18_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI18_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject
{
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI18_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
