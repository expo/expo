// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCamera/EXCameraMicrophonePermissionRequester.h>
#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation EXCameraMicrophonePermissionRequester

+ (NSString *)permissionType {
  return @"microphone";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  EXPermissionStatus status;
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
    
  if (!microphoneUsageDescription) {
    EXFatal(EXErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add this entry to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
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
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  EX_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
    EX_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
