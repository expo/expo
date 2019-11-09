// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCamera/EXCameraPermissionRequester.h>
#import <UMCore/UMDefines.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation EXCameraPermissionRequester

+ (NSString *)permissionType {
  return @"camera";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  UMPermissionStatus status;
  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    UMFatal(UMErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these entries to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = UMPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = UMPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  UM_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
