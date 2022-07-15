// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXCamera/ABI46_0_0EXCameraPermissionRequester.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation ABI46_0_0EXCameraPermissionRequester

+ (NSString *)permissionType {
  return @"camera";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  ABI46_0_0EXPermissionStatus status;
  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI46_0_0EXFatal(ABI46_0_0EXErrorWithMessage(@"This app is missing either NSCameraUsageDescription or NSMicrophoneUsageDescription, so audio/video services will fail. Add one of these entries to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI46_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI46_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI46_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecter:(ABI46_0_0EXPromiseRejectBlock)reject
{
  ABI46_0_0EX_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    ABI46_0_0EX_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
