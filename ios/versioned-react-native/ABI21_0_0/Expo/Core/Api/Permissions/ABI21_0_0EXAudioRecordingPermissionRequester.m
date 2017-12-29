// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXAudioRecordingPermissionRequester.h"
#import <ReactABI21_0_0/ABI21_0_0RCTUtils.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI21_0_0EXAudioRecordingPermissionRequester ()

@property (nonatomic, weak) id<ABI21_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI21_0_0EXAudioRecordingPermissionRequester

+ (NSDictionary *)permissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI21_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI21_0_0RCTFatal(ABI21_0_0RCTErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI21_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI21_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI21_0_0EXPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": [ABI21_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI21_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI21_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI21_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
