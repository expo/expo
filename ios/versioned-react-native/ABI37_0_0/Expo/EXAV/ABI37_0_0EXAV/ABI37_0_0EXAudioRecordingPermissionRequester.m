// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXAV/ABI37_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>

#import <AVFoundation/AVFoundation.h>

@implementation ABI37_0_0EXAudioRecordingPermissionRequester

+ (NSString *)permissionType
{
  return @"audioRecording";
}

- (NSDictionary *)getPermissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI37_0_0UMPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI37_0_0UMFatal(ABI37_0_0UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI37_0_0UMPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI37_0_0UMPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI37_0_0UMPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  ABI37_0_0UM_WEAKIFY(self)
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    ABI37_0_0UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
