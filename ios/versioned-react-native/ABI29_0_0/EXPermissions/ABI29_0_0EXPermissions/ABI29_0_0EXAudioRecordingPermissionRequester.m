// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXPermissions/ABI29_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI29_0_0EXAudioRecordingPermissionRequester ()

@property (nonatomic, weak) id<ABI29_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI29_0_0EXAudioRecordingPermissionRequester

+ (NSDictionary *)permissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI29_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI29_0_0EXFatal(ABI29_0_0EXErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI29_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI29_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI29_0_0EXPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": [ABI29_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI29_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI29_0_0EXPromiseResolveBlock)resolve rejecter:(ABI29_0_0EXPromiseRejectBlock)reject
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI29_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
