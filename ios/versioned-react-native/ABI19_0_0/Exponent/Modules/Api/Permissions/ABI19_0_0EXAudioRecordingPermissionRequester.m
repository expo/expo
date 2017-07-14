// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXAudioRecordingPermissionRequester.h"
#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI19_0_0EXAudioRecordingPermissionRequester ()

@property (nonatomic, weak) id<ABI19_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI19_0_0EXAudioRecordingPermissionRequester

+ (NSDictionary *)permissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI19_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI19_0_0RCTFatal(ABI19_0_0RCTErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI19_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI19_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI19_0_0EXPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": [ABI19_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI19_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI19_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI19_0_0RCTPromiseRejectBlock)reject
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI19_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
