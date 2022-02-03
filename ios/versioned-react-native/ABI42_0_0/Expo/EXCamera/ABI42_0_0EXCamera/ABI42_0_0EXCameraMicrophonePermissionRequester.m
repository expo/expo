// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXCamera/ABI42_0_0EXCameraMicrophonePermissionRequester.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation ABI42_0_0EXCameraMicrophonePermissionRequester

+ (NSString *)permissionType {
  return @"microphone";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  ABI42_0_0EXPermissionStatus status;
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
    
  if (!microphoneUsageDescription) {
    ABI42_0_0UMFatal(ABI42_0_0UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add this entry to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI42_0_0EXPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI42_0_0EXPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI42_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  ABI42_0_0UM_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
    ABI42_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
