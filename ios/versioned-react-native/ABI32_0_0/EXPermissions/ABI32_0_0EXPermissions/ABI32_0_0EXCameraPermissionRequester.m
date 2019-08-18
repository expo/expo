// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXPermissions/ABI32_0_0EXCameraPermissionRequester.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI32_0_0EXCameraPermissionRequester ()

@property (nonatomic, weak) id<ABI32_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI32_0_0EXCameraPermissionRequester

+ (NSDictionary *)permissions
{
  AVAuthorizationStatus systemStatus;
  ABI32_0_0EXPermissionStatus status;

  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI32_0_0EXFatal(ABI32_0_0EXErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI32_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI32_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI32_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI32_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI32_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI32_0_0EXPromiseResolveBlock)resolve rejecter:(ABI32_0_0EXPromiseRejectBlock)reject
{
  __weak ABI32_0_0EXCameraPermissionRequester *weakSelf = self;
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    __strong ABI32_0_0EXCameraPermissionRequester *strongSelf = weakSelf;
    if (strongSelf) {
      resolve([[strongSelf class] permissions]);
      if (strongSelf.delegate) {
        [strongSelf.delegate permissionRequesterDidFinish:strongSelf];
      }
    }
  }];
}

- (void)setDelegate:(id<ABI32_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
