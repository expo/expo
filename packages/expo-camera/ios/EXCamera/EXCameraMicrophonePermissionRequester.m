// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCamera/EXCameraMicrophonePermissionRequester.h>
#import <UMCore/UMDefines.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation EXCameraMicrophonePermissionRequester

+ (NSString *)permissionType {
  return @"microphone";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  UMPermissionStatus status;
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
    
  if (!microphoneUsageDescription) {
    UMFatal(UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add this entry to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];
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
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
    UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end


