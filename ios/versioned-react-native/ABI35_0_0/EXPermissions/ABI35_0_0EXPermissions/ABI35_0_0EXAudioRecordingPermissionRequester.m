// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXPermissions/ABI35_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI35_0_0EXAudioRecordingPermissionRequester ()

@property (nonatomic, weak) id<ABI35_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI35_0_0EXAudioRecordingPermissionRequester

+ (NSDictionary *)permissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI35_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI35_0_0UMFatal(ABI35_0_0UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI35_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI35_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI35_0_0EXPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": [ABI35_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI35_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI35_0_0UMPromiseResolveBlock)resolve rejecter:(ABI35_0_0UMPromiseRejectBlock)reject
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI35_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
