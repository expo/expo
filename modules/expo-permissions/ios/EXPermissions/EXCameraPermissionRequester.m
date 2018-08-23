// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXCameraPermissionRequester.h>
#import <EXCore/EXDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface EXCameraPermissionRequester ()

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXCameraPermissionRequester

+ (NSDictionary *)permissions
{
  AVAuthorizationStatus systemStatus;
  EXPermissionStatus status;

  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    EXFatal(EXErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
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

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  __weak EXCameraPermissionRequester *weakSelf = self;
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    __strong EXCameraPermissionRequester *strongSelf = weakSelf;
    if (strongSelf) {
      resolve([[strongSelf class] permissions]);
      if (strongSelf.delegate) {
        [strongSelf.delegate permissionRequesterDidFinish:strongSelf];
      }
    }
  }];
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
