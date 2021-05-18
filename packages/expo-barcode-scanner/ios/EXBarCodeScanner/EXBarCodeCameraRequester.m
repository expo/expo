// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBarCodeScanner/EXBarCodeCameraRequester.h>
#import <UMCore/UMDefines.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>

#import <AVFoundation/AVFoundation.h>


@implementation EXBareCodeCameraRequester

+ (NSString *)permissionType {
  return @"camera";
}

- (NSDictionary *)getPermissions
{
  AVAuthorizationStatus systemStatus;
  EXPermissionStatus status;
  NSString *cameraUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCameraUsageDescription"];
  if (!cameraUsageDescription) {
    UMFatal(UMErrorWithMessage(@"This app is missing 'NSCameraUsageDescription', so video services will fail. Add this entry to your bundle's Info.plist."));
    systemStatus = AVAuthorizationStatusDenied;
  } else {
    systemStatus = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
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

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  UM_WEAKIFY(self)
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
