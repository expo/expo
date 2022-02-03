// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXCamera/ABI43_0_0EXCameraMicrophonePermissionRequester.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation ABI43_0_0EXCameraMicrophonePermissionRequester

+ (NSString *)permissionType {
  return @"microphone";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  ABI43_0_0EXPermissionStatus status;
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
    
  if (!microphoneUsageDescription) {
    ABI43_0_0EXFatal(ABI43_0_0EXErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add this entry to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI43_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI43_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI43_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject
{
  ABI43_0_0EX_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
    ABI43_0_0EX_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
