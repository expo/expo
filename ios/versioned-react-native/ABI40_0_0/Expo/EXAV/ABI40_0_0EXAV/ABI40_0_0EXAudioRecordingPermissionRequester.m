// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXAV/ABI40_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMDefines.h>

#import <AVFoundation/AVFoundation.h>

@implementation ABI40_0_0EXAudioRecordingPermissionRequester

+ (NSString *)permissionType
{
  return @"audioRecording";
}

- (NSDictionary *)getPermissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI40_0_0UMPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI40_0_0UMFatal(ABI40_0_0UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI40_0_0UMPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI40_0_0UMPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI40_0_0UMPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI40_0_0UMPromiseResolveBlock)resolve rejecter:(ABI40_0_0UMPromiseRejectBlock)reject
{
  ABI40_0_0UM_WEAKIFY(self)
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    ABI40_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
