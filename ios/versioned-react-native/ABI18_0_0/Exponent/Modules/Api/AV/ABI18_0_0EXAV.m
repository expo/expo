// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ReactABI18_0_0/ABI18_0_0RCTUIManager.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUtils.h>

#import "ABI18_0_0EXAV.h"
#import "ABI18_0_0EXAVPlayerData.h"
#import "ABI18_0_0EXFileSystem.h"
#import "ABI18_0_0EXScope.h"
#import "ABI18_0_0EXVideoView.h"

@interface ABI18_0_0EXAV ()

@property (nonatomic, assign) BOOL audioIsEnabled;
@property (nonatomic, assign) ABI18_0_0EXAVAudioSessionMode currentAudioSessionMode;
@property (nonatomic, assign) BOOL isBackgrounded;

@property (nonatomic, assign) ABI18_0_0EXAudioInterruptionMode audioInterruptionMode;
@property (nonatomic, assign) BOOL playsInSilentMode;
@property (nonatomic, assign) BOOL allowsAudioRecording;

@property (nonatomic, assign) int soundDictionaryKeyCount;
@property (nonatomic, strong) NSMutableDictionary <NSNumber *, ABI18_0_0EXAVPlayerData *> *soundDictionary;
@property (nonatomic, strong) NSMutableSet <NSObject<ABI18_0_0EXAVObject> *> *videoSet;

@property (nonatomic, strong) AVAudioRecorder *audioRecorder;
@property (nonatomic, assign) BOOL audioRecorderIsPreparing;
@property (nonatomic, assign) int audioRecorderDurationMillis;

@end

@implementation ABI18_0_0EXAV

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _audioIsEnabled = YES;
    _currentAudioSessionMode = ABI18_0_0EXAVAudioSessionModeInactive;
    _isBackgrounded = NO;
    
    _audioInterruptionMode = ABI18_0_0EXAudioInterruptionModeMixWithOthers;
    _playsInSilentMode = false;
    _allowsAudioRecording = false;
    
    _soundDictionaryKeyCount = 0;
    _soundDictionary = [NSMutableDictionary new];
    _videoSet = [NSMutableSet new];
    
    _audioRecorder = nil;
    _audioRecorderIsPreparing = false;
    _audioRecorderDurationMillis = 0;
    
    // These only need to be set once:
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleAudioSessionInterruption:)
                                                 name:AVAudioSessionInterruptionNotification
                                               object:session];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleMediaServicesReset)
                                                 name:AVAudioSessionMediaServicesWereResetNotification
                                               object:session];
  }
  
  return self;
}

#pragma mark - Expo experience lifecycle

- (void)setBridge:(ABI18_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidForeground:)
                                               name:@"ABI18_0_0EXKernelBridgeDidForegroundNotification"
                                             object:_bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidBackground:)
                                               name:@"ABI18_0_0EXKernelBridgeDidBackgroundNotification"
                                             object:_bridge];
}

- (void)_bridgeDidForeground:(NSNotification *)notification
{
  _isBackgrounded = NO;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI18_0_0EXAVObject> *exAVObject) {
    [exAVObject bridgeDidForeground:notification];
  }];
}

- (void)_bridgeDidBackground:(NSNotification *)notification
{
  _isBackgrounded = YES;
  [self _deactivateAudioSession]; // This will pause all players and stop all recordings
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI18_0_0EXAVObject> *exAVObject) {
    [exAVObject bridgeDidBackground:notification];
  }];
}

#pragma mark - Global audio state control API

- (void)registerVideoForAudioLifecycle:(NSObject<ABI18_0_0EXAVObject> *)video
{
  [_videoSet addObject:video];
}

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI18_0_0EXAVObject> *)video
{
  [_videoSet removeObject:video];
}

- (void)_runBlockForAllAVObjects:(void (^)(NSObject<ABI18_0_0EXAVObject> *exAVObject))block
{
  for (ABI18_0_0EXAVPlayerData *data in [_soundDictionary allValues]) {
    block(data);
  }
  for (NSObject<ABI18_0_0EXAVObject> *video in [_videoSet allObjects]) {
    block(video);
  }
}

// This method is placed here so that it is easily referrable from _setAudioSessionCategoryForAudioMode.
- (NSError *)_setAudioMode:(NSDictionary *)mode
{
  BOOL playsInSilentMode = ((NSNumber *)mode[@"playsInSilentModeIOS"]).boolValue;
  ABI18_0_0EXAudioInterruptionMode interruptionMode = ((NSNumber *)mode[@"interruptionModeIOS"]).intValue;
  BOOL allowsRecording = ((NSNumber *)mode[@"allowsRecordingIOS"]).boolValue;
  
  if (!playsInSilentMode && interruptionMode == ABI18_0_0EXAudioInterruptionModeDuckOthers) {
    return ABI18_0_0RCTErrorWithMessage(@"Impossible audio mode: playsInSilentMode and duckOthers cannot both be set on iOS.");
  } else if (!playsInSilentMode && allowsRecording) {
    return ABI18_0_0RCTErrorWithMessage(@"Impossible audio mode: playsInSilentMode and allowsRecording cannot both be set on iOS.");
  } else {
    if (!allowsRecording) {
      if (_audioRecorder && [_audioRecorder isRecording]) {
        [_audioRecorder pause];
      }
    }
    
    _playsInSilentMode = playsInSilentMode;
    _audioInterruptionMode = interruptionMode;
    _allowsAudioRecording = allowsRecording;
    
    if (_currentAudioSessionMode != ABI18_0_0EXAVAudioSessionModeInactive) {
      return [self _updateAudioSessionCategory:[AVAudioSession sharedInstance] forAudioSessionMode:[self _getAudioSessionModeRequired]];
    }
    return nil;
  }
}

- (NSError *)_updateAudioSessionCategory:(AVAudioSession *)audioSession forAudioSessionMode:(ABI18_0_0EXAVAudioSessionMode)audioSessionMode
{
  NSError *error;
  ABI18_0_0EXAudioInterruptionMode activeInterruptionMode = audioSessionMode == ABI18_0_0EXAVAudioSessionModeActiveMuted
    ? ABI18_0_0EXAudioInterruptionModeMixWithOthers : _audioInterruptionMode;
  
  if (!_playsInSilentMode) {
    // _allowsRecording is guaranteed to be false, and _interruptionMode is guaranteed to not be ABI18_0_0EXAudioInterruptionModeDuckOthers (see above)
    if (_audioInterruptionMode == ABI18_0_0EXAudioInterruptionModeDoNotMix) {
      [audioSession setCategory:AVAudioSessionCategorySoloAmbient error:&error];
    } else {
      [audioSession setCategory:AVAudioSessionCategoryAmbient error:&error];
    }
  } else {
    NSString *category = _allowsAudioRecording ? AVAudioSessionCategoryPlayAndRecord : AVAudioSessionCategoryPlayback;
    switch (activeInterruptionMode) {
      case ABI18_0_0EXAudioInterruptionModeDoNotMix:
        [audioSession setCategory:category error:&error];
        break;
      case ABI18_0_0EXAudioInterruptionModeDuckOthers:
        [audioSession setCategory:category withOptions:AVAudioSessionCategoryOptionDuckOthers error:&error];
        break;
      case ABI18_0_0EXAudioInterruptionModeMixWithOthers:
      default:
        [audioSession setCategory:category withOptions:AVAudioSessionCategoryOptionMixWithOthers error:&error];
        break;
    }
  }
  return error;
}

- (ABI18_0_0EXAVAudioSessionMode)_getAudioSessionModeRequired
{
  __block ABI18_0_0EXAVAudioSessionMode audioSessionModeRequired = ABI18_0_0EXAVAudioSessionModeInactive;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI18_0_0EXAVObject> *exAVObject) {
    ABI18_0_0EXAVAudioSessionMode audioSessionModeRequiredByThisObject = [exAVObject getAudioSessionModeRequired];
    if (audioSessionModeRequiredByThisObject > audioSessionModeRequired) {
      audioSessionModeRequired = audioSessionModeRequiredByThisObject;
    }
  }];
  
  if (audioSessionModeRequired == ABI18_0_0EXAVAudioSessionModeInactive
      &&_audioRecorder && ([_audioRecorder isRecording] || _audioRecorderIsPreparing)) {
    audioSessionModeRequired = ABI18_0_0EXAVAudioSessionModeActiveMuted;
  }
  
  return audioSessionModeRequired;
}

- (NSError *)promoteAudioSessionIfNecessary
{
  if (!_audioIsEnabled) {
    return ABI18_0_0RCTErrorWithMessage(@"Expo Audio is disabled, so the audio session could not be activated.");
  }
  if (_isBackgrounded) {
    return ABI18_0_0RCTErrorWithMessage(@"This experience is currently in the background, so the audio session could not be activated.");
  }
  
  ABI18_0_0EXAVAudioSessionMode audioSessionModeRequired = [self _getAudioSessionModeRequired];
  
  if (_currentAudioSessionMode >= audioSessionModeRequired) {
    return nil;
  }
  
  AVAudioSession *session = [AVAudioSession sharedInstance];
  
  NSError *error = [self _updateAudioSessionCategory:session forAudioSessionMode:audioSessionModeRequired];
  if (error) {
    return error;
  }
  
  if (_currentAudioSessionMode == ABI18_0_0EXAVAudioSessionModeInactive) {
    [session setActive:YES error:&error];
    if (error) {
      return error;
    }
  }
  
  _currentAudioSessionMode = audioSessionModeRequired;
  return nil;
}

- (NSError *)_deactivateAudioSession
{
  if (_currentAudioSessionMode == ABI18_0_0EXAVAudioSessionModeInactive) {
    return nil;
  }
  
  // We must have all players, recorders, and videos paused in order to effectively deactivate the session.
  [self _runBlockForAllAVObjects:^(NSObject<ABI18_0_0EXAVObject> *exAVObject) {
    [exAVObject pauseImmediately];
  }];
  if (_audioRecorder && [_audioRecorder isRecording]) {
    [_audioRecorder pause];
  }
  
  NSError *error;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setActive:NO error:&error];
  // Restore the AVAudioSession to the system default for proper sandboxing.
  [session setCategory:AVAudioSessionCategorySoloAmbient error:&error];
  if (!error) {
    _currentAudioSessionMode = ABI18_0_0EXAVAudioSessionModeInactive;
  }
  return error;
}

- (NSError *)demoteAudioSessionIfPossible
{
  ABI18_0_0EXAVAudioSessionMode audioSessionModeRequired = [self _getAudioSessionModeRequired];
  
  if (_currentAudioSessionMode <= audioSessionModeRequired) {
    return nil;
  }
  
  if (audioSessionModeRequired == ABI18_0_0EXAVAudioSessionModeActiveMuted) {
    NSError *error = [self _updateAudioSessionCategory:[AVAudioSession sharedInstance] forAudioSessionMode:audioSessionModeRequired];
    if (!error) {
      _currentAudioSessionMode = ABI18_0_0EXAVAudioSessionModeActiveMuted;
    }
    return error;
  }
  return [self _deactivateAudioSession];
}

- (void)_handleAudioSessionInterruption:(NSNotification*)notification
{
  NSNumber *interruptionType = [[notification userInfo] objectForKey:AVAudioSessionInterruptionTypeKey];
  if (interruptionType.unsignedIntegerValue == AVAudioSessionInterruptionTypeBegan) {
    _currentAudioSessionMode = ABI18_0_0EXAVAudioSessionModeInactive;
  }
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI18_0_0EXAVObject> *exAVObject) {
    [exAVObject handleAudioSessionInterruption:notification];
  }];
}

- (void)_handleMediaServicesReset
{
  // See here: https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
  
  _currentAudioSessionMode = ABI18_0_0EXAVAudioSessionModeInactive;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI18_0_0EXAVObject> *exAVObject) {
    [exAVObject handleMediaServicesReset:nil];
  }];
  
  if (_audioRecorder) {
    [self _createNewAudioRecorder]; // TODO What should we do with old data here?
    [_audioRecorder prepareToRecord];
  }
}

#pragma mark - Internal sound playback helper methods

- (void)_runBlock:(void (^)(ABI18_0_0EXAVPlayerData *data))block
  withSoundForKey:(nonnull NSNumber *)key
     withRejecter:(ABI18_0_0RCTPromiseRejectBlock)reject
{
  ABI18_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    block(data);
  } else {
    reject(@"E_AUDIO_NOPLAYER", nil, ABI18_0_0RCTErrorWithMessage(@"Player does not exist."));
  }
}

- (void)_removeSoundForKey:(NSNumber *)key
{
  ABI18_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    [data pauseImmediately];
    [self demoteAudioSessionIfPossible];
  }
  _soundDictionary[key] = nil;
}

#pragma mark - Internal video playback helper method

- (void)_runBlock:(void (^)(ABI18_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)ReactABI18_0_0Tag
     withRejecter:(ABI18_0_0RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [_bridge.uiManager viewForReactABI18_0_0Tag:ReactABI18_0_0Tag];
    if ([view isKindOfClass:[ABI18_0_0EXVideoView class]]) {
      dispatch_async(ABI18_0_0RCTGetUIManagerQueue(), ^{
        block((ABI18_0_0EXVideoView *)view);
      });
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI18_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, ABI18_0_0RCTErrorWithMessage(errorMessage));
    }
  });
}

#pragma mark - Internal audio recording helper methods

- (void)_createNewAudioRecorder
{
  [self _removeAudioRecorder];
  
  NSString *filename = [NSString stringWithFormat:@"recording-%@.caf", [[NSUUID UUID] UUIDString]];
  [ABI18_0_0EXFileSystem ensureDirExistsWithPath:[self.bridge.experienceScope scopedPathWithPath:@"AV"
                                                                            withOptions:@{@"cache": @YES}]];
  NSString *soundFilePath = [self.bridge.experienceScope scopedPathWithPath:[@"AV" stringByAppendingPathComponent:filename]
                                                                withOptions:@{@"cache": @(YES)}];
  NSURL *soundFileURL = [NSURL fileURLWithPath:soundFilePath];
  
  NSDictionary *recordSettings = @{AVEncoderAudioQualityKey: @(AVAudioQualityMedium),
                                   AVEncoderBitRateKey: @(128000),
                                   AVNumberOfChannelsKey: @(2),
                                   AVSampleRateKey: @(44100.0)};
  
  NSError *error;
  AVAudioRecorder *recorder = [[AVAudioRecorder alloc] initWithURL:soundFileURL
                                                          settings:recordSettings
                                                             error:&error];
  if (error == nil) {
    _audioRecorder = recorder;
  }
}

- (int)_getDurationMillisOfRecordingAudioRecorder
{
  return _audioRecorder ? (int) (_audioRecorder.currentTime * 1000) : 0;
}

- (NSDictionary *)_getAudioRecorderStatus
{
  if (_audioRecorder) {
    int durationMillisFromRecorder = [self _getDurationMillisOfRecordingAudioRecorder];
    // After stop, the recorder's duration goes to zero, so we replace it with the correct duration in this case.
    int durationMillis = durationMillisFromRecorder == 0 ? _audioRecorderDurationMillis : durationMillisFromRecorder;
    return @{@"canRecord": @(YES),
             @"isRecording": @([_audioRecorder isRecording]),
             @"durationMillis": @(durationMillis)};
  } else {
    return nil;
  }
}

- (BOOL)_checkAudioRecorderExistsOrReject:(ABI18_0_0RCTPromiseRejectBlock)reject
{
  if (_audioRecorder == nil) {
    reject(@"E_AUDIO_NORECORDER", nil, ABI18_0_0RCTErrorWithMessage(@"Recorder does not exist."));
  }
  return _audioRecorder != nil;
}

- (void)_removeAudioRecorder
{
  if (_audioRecorder) {
    [_audioRecorder stop];
    [self demoteAudioSessionIfPossible];
    _audioRecorder = nil;
  }
}

ABI18_0_0RCT_EXPORT_MODULE(ExponentAV);

#pragma mark - Audio API: Global settings

ABI18_0_0RCT_EXPORT_METHOD(setAudioIsEnabled:(BOOL)value
                           resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  _audioIsEnabled = value;
  
  if (!value) {
    [self _deactivateAudioSession];
  }
  resolve(nil);
}

ABI18_0_0RCT_EXPORT_METHOD(setAudioMode:(nonnull NSDictionary *)mode
                      resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                      rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  NSError *error = [self _setAudioMode:mode];
  
  if (error) {
    reject(@"E_AUDIO_AUDIOMODE", nil, error);
  } else {
    resolve(nil);
  }
}

#pragma mark - Unified playback API - Audio

ABI18_0_0RCT_EXPORT_METHOD(loadForSound:(nonnull NSString *)uriString
                    withStatus:(nonnull NSDictionary *)status
                   withSuccess:(ABI18_0_0RCTResponseSenderBlock)loadSuccess
                     withError:(ABI18_0_0RCTResponseSenderBlock)loadError)
{
  NSNumber *key = @(_soundDictionaryKeyCount++);
  __weak __typeof__(self) weakSelf = self;
  ABI18_0_0EXAVPlayerData *data = [[ABI18_0_0EXAVPlayerData alloc] initWithEXAV:self
                                                      withURL:[NSURL URLWithString:uriString]
                                                   withStatus:status
                                         withLoadFinishBlock:^(BOOL success, NSDictionary *successStatus, NSString *error) {
                                           if (success) {
                                             loadSuccess(@[key, successStatus]);
                                           } else {
                                             [weakSelf _removeSoundForKey:key];
                                             loadError(@[error]);
                                           }
                                         }];
  data.errorCallback = ^(NSString *error) {
    __strong __typeof__(self) strongSelf = weakSelf;
    
    if (strongSelf) {
      [strongSelf _removeSoundForKey:key];
    }
  };
  _soundDictionary[key] = data;
}

ABI18_0_0RCT_EXPORT_METHOD(unloadForSound:(nonnull NSNumber *)key
                        resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                        rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI18_0_0EXAVPlayerData *data) {
    [self _removeSoundForKey:key];
    resolve([ABI18_0_0EXAVPlayerData getUnloadedStatus]);
  } withSoundForKey:key withRejecter:reject];
}

ABI18_0_0RCT_EXPORT_METHOD(setStatusForSound:(nonnull NSNumber *)key
                         withStatus:(nonnull NSDictionary *)status
                           resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI18_0_0EXAVPlayerData *data) {
    [data setStatus:status
           resolver:resolve
           rejecter:reject];
  } withSoundForKey:key withRejecter:reject];
}

ABI18_0_0RCT_EXPORT_METHOD(getStatusForSound:(nonnull NSNumber *)key
                           resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI18_0_0EXAVPlayerData *data) {
    NSDictionary *status = [data getStatus];
    resolve(status);
  } withSoundForKey:key withRejecter:reject];
}

ABI18_0_0RCT_EXPORT_METHOD(setStatusUpdateCallbackForSound:(nonnull NSNumber *)key
                                     withCallback:(ABI18_0_0RCTResponseSenderBlock)callback)
{
  ABI18_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    __block BOOL used = NO; // ABI18_0_0RCTResponseSenderBlock can only be used once
    data.statusUpdateCallback = ^(NSDictionary *status) {
      if (!used) {
        used = YES;
        callback(@[status]);
      }
    };
  }
}

ABI18_0_0RCT_EXPORT_METHOD(setErrorCallbackForSound:(nonnull NSNumber *)key
                              withCallback:(ABI18_0_0RCTResponseSenderBlock)callback)
{
  ABI18_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    __block BOOL used = NO; // ABI18_0_0RCTResponseSenderBlock can only be used once
    __weak __typeof__(self) weakSelf = self;
    data.errorCallback = ^(NSString *error) {
      __strong __typeof__(self) strongSelf = weakSelf;
      
      if (strongSelf && !used) {
        used = YES;
        [strongSelf _removeSoundForKey:key];
        callback(@[error]);
      }
    };
  }
}

#pragma mark - Unified playback API - Video

ABI18_0_0RCT_EXPORT_METHOD(loadForVideo:(nonnull NSNumber *)ReactABI18_0_0Tag
                           uri:(nonnull NSString *)uriString
                    withStatus:(nonnull NSDictionary *)status
                      resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                      rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI18_0_0EXVideoView *view) {
    [view setUri:uriString withStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI18_0_0Tag withRejecter:reject];
}

ABI18_0_0RCT_EXPORT_METHOD(unloadForVideo:(nonnull NSNumber *)ReactABI18_0_0Tag
                        resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                        rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI18_0_0EXVideoView *view) {
    [view setUri:nil withStatus:nil resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI18_0_0Tag withRejecter:reject];
}

ABI18_0_0RCT_EXPORT_METHOD(setStatusForVideo:(nonnull NSNumber *)ReactABI18_0_0Tag
                         withStatus:(nonnull NSDictionary *)status
                           resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI18_0_0EXVideoView *view) {
    [view setStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI18_0_0Tag withRejecter:reject];
}

ABI18_0_0RCT_EXPORT_METHOD(getStatusForVideo:(nonnull NSNumber *)ReactABI18_0_0Tag
                           resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI18_0_0EXVideoView *view) {
    resolve(view.status);
  } withEXVideoViewForTag:ReactABI18_0_0Tag withRejecter:reject];
}

// Note that setStatusUpdateCallback happens in the JS for video via onStatusUpdate

#pragma mark - Audio API: Recording

ABI18_0_0RCT_EXPORT_METHOD(prepareAudioRecorder:(ABI18_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  [self _createNewAudioRecorder];
  
  if (_audioRecorder) {
    _audioRecorderIsPreparing = true;
    NSError *error = [self promoteAudioSessionIfNecessary];
    if (error) {
      reject(@"E_AUDIO_RECORDERNOTCREATED", @"Prepare encountered an error: audio session not activated!", error);
    } else if ([_audioRecorder prepareToRecord]) {
      resolve(@{@"uri": [[_audioRecorder url] absoluteString],
                @"status": [self _getAudioRecorderStatus]});
    } else {
      reject(@"E_AUDIO_RECORDERNOTCREATED", nil, ABI18_0_0RCTErrorWithMessage(@"Prepare encountered an error: recorder not prepared."));
    }
    _audioRecorderIsPreparing = false;
    [self demoteAudioSessionIfPossible];
  } else {
    reject(@"E_AUDIO_RECORDERNOTCREATED", nil, ABI18_0_0RCTErrorWithMessage(@"Prepare encountered an error: recorder not created."));
  }
}

ABI18_0_0RCT_EXPORT_METHOD(startAudioRecording:(ABI18_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (!_allowsAudioRecording) {
      reject(@"E_AUDIO_AUDIOMODE", nil, ABI18_0_0RCTErrorWithMessage(@"Recording not allowed on iOS."));
    } else if (!_audioRecorder.recording) {
      NSError *error = [self promoteAudioSessionIfNecessary];
      if (!error) {
        if ([_audioRecorder record]) {
          resolve([self _getAudioRecorderStatus]);
        } else {
          reject(@"E_AUDIO_RECORDING", nil, ABI18_0_0RCTErrorWithMessage(@"Start encountered an error: recording not started."));
        }
      } else {
        reject(@"E_AUDIO_RECORDING", @"Start encountered an error: audio session not activated.", error);
      }
    }
  }
}

ABI18_0_0RCT_EXPORT_METHOD(pauseAudioRecording:(ABI18_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (_audioRecorder.recording) {
      [_audioRecorder pause];
      [self demoteAudioSessionIfPossible];
    }
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI18_0_0RCT_EXPORT_METHOD(stopAudioRecording:(ABI18_0_0RCTPromiseResolveBlock)resolve
                            rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (_audioRecorder.recording) {
      _audioRecorderDurationMillis = [self _getDurationMillisOfRecordingAudioRecorder];
      [_audioRecorder stop];
      [self demoteAudioSessionIfPossible];
    }
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI18_0_0RCT_EXPORT_METHOD(getAudioRecordingStatus:(ABI18_0_0RCTPromiseResolveBlock)resolve
                                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI18_0_0RCT_EXPORT_METHOD(unloadAudioRecorder:(ABI18_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    [self _removeAudioRecorder];
    resolve(nil);
  }
}

#pragma mark - Lifecycle

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  // This will clear all @properties and deactivate the audio session:
  
  for (NSObject<ABI18_0_0EXAVObject> *video in [_videoSet allObjects]) {
    [video pauseImmediately];
    [_videoSet removeObject:video];
  }
  [self _removeAudioRecorder];
  for (NSNumber *key in [_soundDictionary allKeys]) {
    [self _removeSoundForKey:key];
  }
}


@end
