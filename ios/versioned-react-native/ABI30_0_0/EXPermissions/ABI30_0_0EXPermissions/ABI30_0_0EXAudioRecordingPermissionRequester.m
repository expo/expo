// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXPermissions/ABI30_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface ABI30_0_0EXAudioRecordingPermissionRequester ()

@property (nonatomic, weak) id<ABI30_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI30_0_0EXAudioRecordingPermissionRequester

+ (NSDictionary *)permissions
{
  AVAudioSessionRecordPermission systemStatus;
  ABI30_0_0EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    ABI30_0_0EXFatal(ABI30_0_0EXErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
    systemStatus = AVAudioSessionRecordPermissionDenied;
  } else {
    systemStatus = [[AVAudioSession sharedInstance] recordPermission];
  }
  switch (systemStatus) {
    case AVAudioSessionRecordPermissionGranted:
      status = ABI30_0_0EXPermissionStatusGranted;
      break;
    case AVAudioSessionRecordPermissionDenied:
      status = ABI30_0_0EXPermissionStatusDenied;
      break;
    case AVAudioSessionRecordPermissionUndetermined:
      status = ABI30_0_0EXPermissionStatusUndetermined;
      break;
  }

  return @{
    @"status": [ABI30_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI30_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI30_0_0EXPromiseResolveBlock)resolve rejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI30_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
