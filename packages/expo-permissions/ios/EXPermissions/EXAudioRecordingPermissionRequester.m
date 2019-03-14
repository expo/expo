// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXAudioRecordingPermissionRequester.h>
#import <UMCore/UMDefines.h>

#import <AVFoundation/AVFoundation.h>

@interface EXAudioRecordingPermissionRequester ()

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXAudioRecordingPermissionRequester

+ (NSDictionary *)permissions
{
  AVAudioSessionRecordPermission systemStatus;
  EXPermissionStatus status;

  NSString *microphoneUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSMicrophoneUsageDescription"];
  if (!microphoneUsageDescription) {
    UMFatal(UMErrorWithMessage(@"This app is missing NSMicrophoneUsageDescription, so audio services will fail. Add one of these keys to your bundle's Info.plist."));
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
    @"status": [EXPermissions permissionStringForStatus:status],
    @"expires": EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve([[self class] permissions]);
    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
