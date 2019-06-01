// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXPermissions/ABI33_0_0EXCameraPermissionRequester.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI33_0_0EXCameraPermissionRequester ()

@property (nonatomic, weak) id<ABI33_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI33_0_0EXCameraPermissionRequester

+ (NSDictionary *)permissions
{
  AVAuthorizationStatus systemStatus;
  ABI33_0_0EXPermissionStatus status;

  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI33_0_0UMFatal(ABI33_0_0UMErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI33_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI33_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
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
  __weak ABI33_0_0EXCameraPermissionRequester *weakSelf = self;
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    __strong ABI33_0_0EXCameraPermissionRequester *strongSelf = weakSelf;
    if (strongSelf) {
      resolve([[strongSelf class] permissions]);
      if (strongSelf.delegate) {
        [strongSelf.delegate permissionRequesterDidFinish:strongSelf];
      }
    }
  }];
}

- (void)setDelegate:(id<ABI33_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
