// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXCamera/ABI41_0_0EXCameraPermissionRequester.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMDefines.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation ABI41_0_0EXCameraPermissionRequester

+ (NSString *)permissionType {
  return @"camera";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  ABI41_0_0UMPermissionStatus status;
  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI41_0_0UMFatal(ABI41_0_0UMErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these entries to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI41_0_0UMPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI41_0_0UMPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI41_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve rejecter:(ABI41_0_0UMPromiseRejectBlock)reject
{
  ABI41_0_0UM_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    ABI41_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
