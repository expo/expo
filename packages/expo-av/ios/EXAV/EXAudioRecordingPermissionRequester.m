// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAV/EXAudioRecordingPermissionRequester.h>
#import <ExpoModulesCore/EXDefines.h>

#import <AVFoundation/AVFoundation.h>
#import <objc/message.h>

static SEL recordRecordPermissionSelector;

@implementation EXAudioRecordingPermissionRequester

+ (NSString *)permissionType
{
  return @"audioRecording";
}

+ (void)load
{
  recordRecordPermissionSelector = NSSelectorFromString([@"request" stringByAppendingString:@"RecordPermission:"]);
}

- (NSDictionary *)getPermissions
{
  AVAudioSessionRecordPermission systemStatus;
  EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    EXFatal(EXErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
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
  ((void (*)(id, SEL, void(^)(BOOL)))objc_msgSend)(AVAudioSession.sharedInstance, recordRecordPermissionSelector, ^(BOOL granted) {
    EX_STRONGIFY(self)
    resolve([self getPermissions]);
  });
}

@end
