// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXPermissions/ABI34_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI34_0_0EXAudioRecordingPermissionRequester ()

@property (nonatomic, weak) id<ABI34_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI34_0_0EXAudioRecordingPermissionRequester

+ (NSDictionary *)permissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI34_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI34_0_0UMFatal(ABI34_0_0UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI34_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI34_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI34_0_0EXPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": [ABI34_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI34_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve rejecter:(ABI34_0_0UMPromiseRejectBlock)reject
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI34_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
