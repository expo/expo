// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXImagePicker/ABI36_0_0EXImagePickerCameraPermissionRequester.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMDefines.h>
#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation ABI36_0_0EXImagePickerCameraPermissionRequester

+ (NSString *)permissionType {
  return @"camera";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  ABI36_0_0UMPermissionStatus status;
  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!(cameraUsageDescription && microphoneUsageDescription)) {
    ABI36_0_0UMFatal(ABI36_0_0UMErrorWithMessage(@"This app is missing either 'NSCameraUsageDescription' or 'NSMicrophoneUsageDescription', so audio/video services will fail. Ensure both of these keys exist in app's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
  }
  switch (systemStatus) {
    case AVAuthorizationStatusAuthorized:
      status = ABI36_0_0UMPermissionStatusGranted;
      break;
    case AVAuthorizationStatusDenied:
    case AVAuthorizationStatusRestricted:
      status = ABI36_0_0UMPermissionStatusDenied;
      break;
    case AVAuthorizationStatusNotDetermined:
      status = ABI36_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve rejecter:(ABI36_0_0UMPromiseRejectBlock)reject
{
  ABI36_0_0UM_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    ABI36_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
