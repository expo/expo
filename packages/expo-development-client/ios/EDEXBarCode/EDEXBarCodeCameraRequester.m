// Copyright 2016-present 650 Industries. All rights reserved.

#import <EDEXBarCodeCameraRequester.h>
#import <EDUMDefines.h>
#import <EDUMPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation EDEXBareCodeCameraRequester

+ (NSString *)permissionType {
  return @"camera";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  EDUMPermissionStatus status;
  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    EDUMFatal(EDUMErrorWithMessage(@"This app is missing either 'NSCameraUsageDescription' or 'NSMicrophoneUsageDescription', so audio/video services will fail. Add both of these entries to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = EDUMPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = EDUMPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = EDUMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(EDUMPromiseResolveBlock)resolve rejecter:(EDUMPromiseRejectBlock)reject
{
  EDUM_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    EDUM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
