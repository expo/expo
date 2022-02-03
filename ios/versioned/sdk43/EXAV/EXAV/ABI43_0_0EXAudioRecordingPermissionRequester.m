// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXAV/ABI43_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>

#import <AVFoundation/AVFoundation.h>

@implementation ABI43_0_0EXAudioRecordingPermissionRequester

+ (NSString *)permissionType
{
  return @"audioRecording";
}

- (NSDictionary *)getPermissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI43_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI43_0_0EXFatal(ABI43_0_0EXErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI43_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI43_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
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
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    ABI43_0_0EX_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
