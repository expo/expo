// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXCamera/ABI37_0_0EXCameraPermissionRequester.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation ABI37_0_0EXCameraPermissionRequester

+ (NSString *)permissionType {
  return @"camera";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  ABI37_0_0UMPermissionStatus status;
  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI37_0_0UMFatal(ABI37_0_0UMErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these entries to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI37_0_0UMPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI37_0_0UMPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI37_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  ABI37_0_0UM_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    ABI37_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
