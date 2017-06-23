// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ReactABI17_0_0/ABI17_0_0RCTUIManager.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

#import "ABI17_0_0EXAV.h"
#import "ABI17_0_0EXAVPlayerData.h"
#import "ABI17_0_0EXFileSystem.h"
#import "ABI17_0_0EXScope.h"
#import "ABI17_0_0EXVideoView.h"

@interface ABI17_0_0EXAV ()

@property (nonatomic, assign) BOOL audioIsEnabled;
@property (nonatomic, assign) BOOL audioSessionActive;
@property (nonatomic, assign) BOOL isBackgrounded;

@property (nonatomic, assign) ABI17_0_0EXAudioInterruptionMode audioInterruptionMode;
@property (nonatomic, assign) BOOL playsInSilentLockedMode;
@property (nonatomic, assign) BOOL allowsAudioRecording;

@property (nonatomic, assign) int soundDictionaryKeyCount;
@property (nonatomic, strong) NSMutableDictionary <NSNumber *, ABI17_0_0EXAVPlayerData *> *soundDictionary;
@property (nonatomic, strong) NSMutableSet <NSObject<ABI17_0_0EXAVObject> *> *videoSet;

@property (nonatomic, strong) AVAudioRecorder *audioRecorder;
@property (nonatomic, assign) BOOL audioRecorderIsPreparing;
@property (nonatomic, assign) int audioRecorderDurationMillis;

@end

@implementation ABI17_0_0EXAV

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _audioIsEnabled = YES;
    _audioSessionActive = NO;
    _isBackgrounded = NO;
    
    _audioInterruptionMode = ABI17_0_0EXAudioInterruptionModeMixWithOthers;
    _playsInSilentLockedMode = false;
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

- (void)setBridge:(ABI17_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidForeground:)
                                               name:@"EXKernelBridgeDidForegroundNotification"
                                             object:_bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidBackground:)
                                               name:@"EXKernelBridgeDidBackgroundNotification"
                                             object:_bridge];
}

- (void)_bridgeDidForeground:(NSNotification *)notification
{
  _isBackgrounded = NO;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI17_0_0EXAVObject> *exAVObject) {
    [exAVObject bridgeDidForeground:notification];
  }];
}

- (void)_bridgeDidBackground:(NSNotification *)notification
{
  _isBackgrounded = YES;
  [self _deactivateAudioSession]; // This will pause all players and stop all recordings
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI17_0_0EXAVObject> *exAVObject) {
    [exAVObject bridgeDidBackground:notification];
  }];
}

#pragma mark - Global audio state control API

- (void)registerVideoForAudioLifecycle:(NSObject<ABI17_0_0EXAVObject> *)video
{
  [_videoSet addObject:video];
}

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI17_0_0EXAVObject> *)video
{
  [_videoSet removeObject:video];
}

- (void)_runBlockForAllAVObjects:(void (^)(NSObject<ABI17_0_0EXAVObject> *exAVObject))block
{
  for (ABI17_0_0EXAVPlayerData *data in [_soundDictionary allValues]) {
    block(data);
  }
  for (NSObject<ABI17_0_0EXAVObject> *video in [_videoSet allObjects]) {
    block(video);
  }
}

// This method is placed here so that it is easily referrable from _setAudioSessionCategoryForAudioMode.
- (NSError *)_setAudioMode:(NSDictionary *)mode
{
  BOOL playsInSilentLockedMode = ((NSNumber *)mode[@"playsInSilentLockedModeIOS"]).boolValue;
  ABI17_0_0EXAudioInterruptionMode interruptionMode = ((NSNumber *)mode[@"interruptionModeIOS"]).intValue;
  BOOL allowsRecording = ((NSNumber *)mode[@"allowsRecordingIOS"]).boolValue;
  
  if (!playsInSilentLockedMode && interruptionMode == ABI17_0_0EXAudioInterruptionModeDuckOthers) {
    return ABI17_0_0RCTErrorWithMessage(@"Impossible audio mode: playsInSilentLockedMode and duckOthers cannot both be set on iOS.");
  } else if (!playsInSilentLockedMode && allowsRecording) {
    return ABI17_0_0RCTErrorWithMessage(@"Impossible audio mode: playsInSilentLockedMode and allowsRecording cannot both be set on iOS.");
  } else {
    if (!allowsRecording) {
      if (_audioRecorder && [_audioRecorder isRecording]) {
        [_audioRecorder pause];
      }
    }
    
    _playsInSilentLockedMode = playsInSilentLockedMode;
    _audioInterruptionMode = interruptionMode;
    _allowsAudioRecording = allowsRecording;
    
    NSError *error;
    if (_audioSessionActive) {
      [self _setAudioSessionCategoryForAudioMode:&error];
    }
    
    return error;
  }
}

- (void)_setAudioSessionCategoryForAudioMode:(NSError **)error
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  
  if (!_playsInSilentLockedMode) {
    // _allowsRecording is guaranteed to be false, and _interruptionMode is guaranteed to not be ABI17_0_0EXAudioInterruptionModeDuckOthers (see above)
    if (_audioInterruptionMode == ABI17_0_0EXAudioInterruptionModeDoNotMix) {
      [session setCategory:AVAudioSessionCategorySoloAmbient error:error];
    } else {
      [session setCategory:AVAudioSessionCategoryAmbient error:error];
    }
  } else {
    NSString *category = _allowsAudioRecording ? AVAudioSessionCategoryPlayAndRecord : AVAudioSessionCategoryPlayback;
    switch (_audioInterruptionMode) {
      case ABI17_0_0EXAudioInterruptionModeDoNotMix:
        [session setCategory:category error:error];
        break;
      case ABI17_0_0EXAudioInterruptionModeDuckOthers:
        [session setCategory:category withOptions:AVAudioSessionCategoryOptionDuckOthers error:error];
        break;
      case ABI17_0_0EXAudioInterruptionModeMixWithOthers:
      default:
        [session setCategory:category withOptions:AVAudioSessionCategoryOptionMixWithOthers error:error];
        break;
    }
  }
}

- (NSError *)activateAudioSessionIfNecessary
{
  if (!_audioIsEnabled) {
    return ABI17_0_0RCTErrorWithMessage(@"Expo Audio is disabled, so the audio session could not be activated.");
  }
  if (_isBackgrounded) {
    return ABI17_0_0RCTErrorWithMessage(@"This experience is currently in the background, so the audio session could not be activated.");
  }
  
  if (_audioSessionActive) {
    return nil;
  }
  
  NSError *error;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [self _setAudioSessionCategoryForAudioMode:&error];
  if (!error) {
    [session setActive:YES error:&error];
    _audioSessionActive = !error;
  }
  return error;
}

- (NSError *)_deactivateAudioSession
{
  if (!_audioSessionActive) {
    return nil;
  }
  
  // We must have all players, recorders, and videos paused in order to effectively deactivate the session.
  [self _runBlockForAllAVObjects:^(NSObject<ABI17_0_0EXAVObject> *exAVObject) {
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
    _audioSessionActive = NO;
  }
  return error;
}

- (NSError *)deactivateAudioSessionIfUnused
{
  __block BOOL audioSessionIsInUse = NO;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI17_0_0EXAVObject> *exAVObject) {
    if ([exAVObject isUsingAudioSession]) {
      audioSessionIsInUse = YES;
    }
  }];
  
  if (_audioRecorder && ([_audioRecorder isRecording] || _audioRecorderIsPreparing)) {
    audioSessionIsInUse = YES;
  }
  
  return audioSessionIsInUse ? nil : [self _deactivateAudioSession];
}

- (void)_handleAudioSessionInterruption:(NSNotification*)notification
{
  NSNumber *interruptionType = [[notification userInfo] objectForKey:AVAudioSessionInterruptionTypeKey];
  if (interruptionType.unsignedIntegerValue == AVAudioSessionInterruptionTypeBegan) {
    _audioSessionActive = NO;
  }
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI17_0_0EXAVObject> *exAVObject) {
    [exAVObject handleAudioSessionInterruption:notification];
  }];
}

- (void)_handleMediaServicesReset
{
  // See here: https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
  
  _audioSessionActive = NO;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI17_0_0EXAVObject> *exAVObject) {
    [exAVObject handleMediaServicesReset:nil];
  }];
  
  if (_audioRecorder) {
    [self _createNewAudioRecorder]; // TODO What should we do with old data here?
    [_audioRecorder prepareToRecord];
  }
}

#pragma mark - Internal sound playback helper methods

- (void)_runBlock:(void (^)(ABI17_0_0EXAVPlayerData *data))block
  withSoundForKey:(nonnull NSNumber *)key
     withRejecter:(ABI17_0_0RCTPromiseRejectBlock)reject
{
  ABI17_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    block(data);
  } else {
    reject(@"E_AUDIO_NOPLAYER", nil, ABI17_0_0RCTErrorWithMessage(@"Player does not exist."));
  }
}

- (void)_removeSoundForKey:(NSNumber *)key
{
  ABI17_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    [data pauseImmediately];
    [self deactivateAudioSessionIfUnused];
  }
  _soundDictionary[key] = nil;
}

#pragma mark - Internal video playback helper method

- (void)_runBlock:(void (^)(ABI17_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)ReactABI17_0_0Tag
     withRejecter:(ABI17_0_0RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [_bridge.uiManager viewForReactABI17_0_0Tag:ReactABI17_0_0Tag];
    if ([view isKindOfClass:[ABI17_0_0EXVideoView class]]) {
      dispatch_async(ABI17_0_0RCTGetUIManagerQueue(), ^{
        block((ABI17_0_0EXVideoView *)view);
      });
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI17_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, ABI17_0_0RCTErrorWithMessage(errorMessage));
    }
  });
}

#pragma mark - Internal audio recording helper methods

- (void)_createNewAudioRecorder
{
  [self _removeAudioRecorder];
  
  NSString *filename = [NSString stringWithFormat:@"recording-%@.caf", [[NSUUID UUID] UUIDString]];
  [ABI17_0_0EXFileSystem ensureDirExistsWithPath:[self.bridge.experienceScope scopedPathWithPath:@"AV"
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

- (BOOL)_checkAudioRecorderExistsOrReject:(ABI17_0_0RCTPromiseRejectBlock)reject
{
  if (_audioRecorder == nil) {
    reject(@"E_AUDIO_NORECORDER", nil, ABI17_0_0RCTErrorWithMessage(@"Recorder does not exist."));
  }
  return _audioRecorder != nil;
}

- (void)_removeAudioRecorder
{
  if (_audioRecorder) {
    [_audioRecorder stop];
    [self deactivateAudioSessionIfUnused];
    _audioRecorder = nil;
  }
}

ABI17_0_0RCT_EXPORT_MODULE(ExponentAV);

#pragma mark - Audio API: Global settings

ABI17_0_0RCT_EXPORT_METHOD(setAudioIsEnabled:(BOOL)value
                           resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  _audioIsEnabled = value;
  
  if (!value) {
    [self _deactivateAudioSession];
  }
  resolve(nil);
}

ABI17_0_0RCT_EXPORT_METHOD(setAudioMode:(nonnull NSDictionary *)mode
                      resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                      rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  NSError *error = [self _setAudioMode:mode];
  
  if (error) {
    reject(@"E_AUDIO_AUDIOMODE", nil, error);
  } else {
    resolve(nil);
  }
}

#pragma mark - Unified playback API - Audio

ABI17_0_0RCT_EXPORT_METHOD(loadForSound:(nonnull NSString *)uriString
                    withStatus:(nonnull NSDictionary *)status
                   withSuccess:(ABI17_0_0RCTResponseSenderBlock)loadSuccess
                     withError:(ABI17_0_0RCTResponseSenderBlock)loadError)
{
  NSNumber *key = @(_soundDictionaryKeyCount++);
  __weak __typeof__(self) weakSelf = self;
  ABI17_0_0EXAVPlayerData *data = [[ABI17_0_0EXAVPlayerData alloc] initWithEXAV:self
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

ABI17_0_0RCT_EXPORT_METHOD(unloadForSound:(nonnull NSNumber *)key
                        resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                        rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXAVPlayerData *data) {
    [self _removeSoundForKey:key];
    resolve([ABI17_0_0EXAVPlayerData getUnloadedStatus]);
  } withSoundForKey:key withRejecter:reject];
}

ABI17_0_0RCT_EXPORT_METHOD(setStatusForSound:(nonnull NSNumber *)key
                         withStatus:(nonnull NSDictionary *)status
                           resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXAVPlayerData *data) {
    [data setStatus:status
           resolver:resolve
           rejecter:reject];
  } withSoundForKey:key withRejecter:reject];
}

ABI17_0_0RCT_EXPORT_METHOD(getStatusForSound:(nonnull NSNumber *)key
                           resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXAVPlayerData *data) {
    NSDictionary *status = [data getStatus];
    resolve(status);
  } withSoundForKey:key withRejecter:reject];
}

ABI17_0_0RCT_EXPORT_METHOD(setStatusUpdateCallbackForSound:(nonnull NSNumber *)key
                                     withCallback:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  ABI17_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    __block BOOL used = NO; // ABI17_0_0RCTResponseSenderBlock can only be used once
    data.statusUpdateCallback = ^(NSDictionary *status) {
      if (!used) {
        used = YES;
        callback(@[status]);
      }
    };
  }
}

ABI17_0_0RCT_EXPORT_METHOD(setErrorCallbackForSound:(nonnull NSNumber *)key
                              withCallback:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  ABI17_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    __block BOOL used = NO; // ABI17_0_0RCTResponseSenderBlock can only be used once
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

ABI17_0_0RCT_EXPORT_METHOD(loadForVideo:(nonnull NSNumber *)ReactABI17_0_0Tag
                           uri:(nonnull NSString *)uriString
                    withStatus:(nonnull NSDictionary *)status
                      resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                      rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXVideoView *view) {
    [view setUri:uriString withStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI17_0_0Tag withRejecter:reject];
}

ABI17_0_0RCT_EXPORT_METHOD(unloadForVideo:(nonnull NSNumber *)ReactABI17_0_0Tag
                        resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                        rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXVideoView *view) {
    [view setUri:nil withStatus:nil resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI17_0_0Tag withRejecter:reject];
}

ABI17_0_0RCT_EXPORT_METHOD(setStatusForVideo:(nonnull NSNumber *)ReactABI17_0_0Tag
                         withStatus:(nonnull NSDictionary *)status
                           resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXVideoView *view) {
    [view setStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI17_0_0Tag withRejecter:reject];
}

ABI17_0_0RCT_EXPORT_METHOD(getStatusForVideo:(nonnull NSNumber *)ReactABI17_0_0Tag
                           resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                           rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXVideoView *view) {
    resolve(view.status);
  } withEXVideoViewForTag:ReactABI17_0_0Tag withRejecter:reject];
}

// Note that setStatusUpdateCallback happens in the JS for video via onStatusUpdate

#pragma mark - Audio API: Recording

ABI17_0_0RCT_EXPORT_METHOD(prepareAudioRecorder:(ABI17_0_0RCTPromiseResolveBlock)resolve
                              rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _createNewAudioRecorder];
  
  if (_audioRecorder) {
    _audioRecorderIsPreparing = true;
    NSError *error = [self activateAudioSessionIfNecessary];
    if (error) {
      reject(@"E_AUDIO_RECORDERNOTCREATED", @"Prepare encountered an error: audio session not activated!", error);
    } else if ([_audioRecorder prepareToRecord]) {
      resolve(@{@"uri": [[_audioRecorder url] absoluteString],
                @"status": [self _getAudioRecorderStatus]});
    } else {
      reject(@"E_AUDIO_RECORDERNOTCREATED", nil, ABI17_0_0RCTErrorWithMessage(@"Prepare encountered an error: recorder not prepared."));
    }
    _audioRecorderIsPreparing = false;
    [self deactivateAudioSessionIfUnused];
  } else {
    reject(@"E_AUDIO_RECORDERNOTCREATED", nil, ABI17_0_0RCTErrorWithMessage(@"Prepare encountered an error: recorder not created."));
  }
}

ABI17_0_0RCT_EXPORT_METHOD(startAudioRecording:(ABI17_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (!_allowsAudioRecording) {
      reject(@"E_AUDIO_AUDIOMODE", nil, ABI17_0_0RCTErrorWithMessage(@"Recording not allowed on iOS."));
    } else if (!_audioRecorder.recording) {
      NSError *error = [self activateAudioSessionIfNecessary];
      if (!error) {
        if ([_audioRecorder record]) {
          resolve([self _getAudioRecorderStatus]);
        } else {
          reject(@"E_AUDIO_RECORDING", nil, ABI17_0_0RCTErrorWithMessage(@"Start encountered an error: recording not started."));
        }
      } else {
        reject(@"E_AUDIO_RECORDING", @"Start encountered an error: audio session not activated.", error);
      }
    }
  }
}

ABI17_0_0RCT_EXPORT_METHOD(pauseAudioRecording:(ABI17_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (_audioRecorder.recording) {
      [_audioRecorder pause];
      [self deactivateAudioSessionIfUnused];
    }
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI17_0_0RCT_EXPORT_METHOD(stopAudioRecording:(ABI17_0_0RCTPromiseResolveBlock)resolve
                            rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (_audioRecorder.recording) {
      _audioRecorderDurationMillis = [self _getDurationMillisOfRecordingAudioRecorder];
      [_audioRecorder stop];
      [self deactivateAudioSessionIfUnused];
    }
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI17_0_0RCT_EXPORT_METHOD(getAudioRecordingStatus:(ABI17_0_0RCTPromiseResolveBlock)resolve
                                 rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI17_0_0RCT_EXPORT_METHOD(unloadAudioRecorder:(ABI17_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
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
  
  for (NSObject<ABI17_0_0EXAVObject> *video in [_videoSet allObjects]) {
    [video pauseImmediately];
    [_videoSet removeObject:video];
  }
  [self _removeAudioRecorder];
  for (NSNumber *key in [_soundDictionary allKeys]) {
    [self _removeSoundForKey:key];
  }
}


@end
