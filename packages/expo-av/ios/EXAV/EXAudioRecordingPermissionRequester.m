// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAV/EXAudioRecordingPermissionRequester.h>
#import <UMCore/UMDefines.h>

#import <AVFoundation/AVFoundation.h>

@implementation EXAudioRecordingPermissionRequester

+ (NSString *)permissionType
{
  return @"audioRecording";
}

- (NSDictionary *)getPermissions
{
  AVAudioSessionRecordPermission systemStatus;
  UMPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    UMFatal(UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = UMPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = UMPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
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
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    UM_STRONGIFY(self)
    resolve([self getPermissions]);
  }];
}

@end
