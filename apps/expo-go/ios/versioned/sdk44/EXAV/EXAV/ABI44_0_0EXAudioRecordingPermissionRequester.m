// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXAV/ABI44_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>

#import <AVFoundation/AVFoundation.h>

@implementation ABI44_0_0EXAudioRecordingPermissionRequester

+ (NSString *)permissionType
{
  return @"audioRecording";
}

- (NSDictionary *)getPermissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI44_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI44_0_0EXFatal(ABI44_0_0EXErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI44_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI44_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI44_0_0EXPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve rejecter:(ABI44_0_0EXPromiseRejectBlock)reject
{
  ABI44_0_0EX_WEAKIFY(self)
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    ABI44_0_0EX_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
