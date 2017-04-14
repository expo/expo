// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ReactABI16_0_0/ABI16_0_0RCTAssert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTUtils.h>

#import "ABI16_0_0EXAudio.h"
#import "ABI16_0_0EXScope.h"
#import "ABI16_0_0EXFileSystem.h"

@interface ABI16_0_0EXAudioPlayerData: NSObject

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) NSNumber *rate;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) id <NSObject> finishObserver;
@property (nonatomic, strong) ABI16_0_0RCTResponseSenderBlock finishCallback;
@property (nonatomic, strong) void (^internalFinishCallback)();
@property (nonatomic, assign) BOOL isLooping;
@property (nonatomic, assign) BOOL shouldCorrectPitch;

@end

@implementation ABI16_0_0EXAudioPlayerData

- (instancetype)initWithPlayer:(AVPlayer *)player
                       withURL:(NSURL *)url
                   withLooping:(BOOL)isLooping
           withPitchCorrection:(BOOL)shouldCorrectPitch
                      withRate:(NSNumber *)rate
    withInternalFinishCallback:(void (^)())internalFinishCallback
{
  _player = player;
  _url = url;
  _finishCallback = nil;
  _internalFinishCallback = internalFinishCallback;
  _isLooping = isLooping;
  _shouldCorrectPitch = shouldCorrectPitch;
  _rate = rate;
  _finishObserver = nil;
  [self addFinishObserverForNewPlayer];

  return self;
}

- (void)addFinishObserverForNewPlayer
{
  if (_finishObserver) {
    [[NSNotificationCenter defaultCenter] removeObserver:_finishObserver];
  }
  
  __weak __typeof__(self) weakSelf = self;
  void (^didPlayToEndTimeObserverBlock)(NSNotification *note) = ^(NSNotification *note) {
    if (weakSelf.isLooping) {
      [weakSelf.player seekToTime:kCMTimeZero];
      [weakSelf playPlayerWithRate];
    } else {
      weakSelf.internalFinishCallback();
      ABI16_0_0RCTResponseSenderBlock callback = weakSelf.finishCallback;
      weakSelf.finishCallback = nil; // Callback can only be invoked once.
      if (callback) {
        callback(@[[weakSelf getStatus]]);
      }
    }
  };
  
  _finishObserver = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemDidPlayToEndTimeNotification
                                                                      object:[_player currentItem]
                                                                       queue:nil
                                                                  usingBlock:didPlayToEndTimeObserverBlock];
}

- (void)playPlayerWithRate
{
  _player.rate = [_rate floatValue];
}

- (BOOL)isPlayerPlaying
{
  if ([_player respondsToSelector:@selector(timeControlStatus)]) {
    // Only available after iOS 10
    return [_player timeControlStatus] == AVPlayerTimeControlStatusPlaying;
  } else {
    // timeControlStatus is preferable to this when available
    // See http://stackoverflow.com/questions/5655864/check-play-state-of-avplayer
    return (_player.rate != 0) && (_player.error == nil);
  }
}

- (NSDictionary *)getStatus
{
  Float64 duration = CMTimeGetSeconds(_player.currentItem.duration);
  Float64 seconds = CMTimeGetSeconds([_player currentTime]);
  // Sometimes [player currentTime] erroneously returns a value out of bounds:
  seconds = seconds < 0 ? 0 : seconds > duration ? duration : seconds;
  return @{@"positionMillis": @((int) (seconds * 1000)),
           @"rate": _rate,
           @"shouldCorrectPitch": @(_shouldCorrectPitch),
           @"volume": @(_player.volume),
           @"isPlaying": @([self isPlayerPlaying]),
           @"isMuted": @(_player.muted),
           @"isLooping": @(_isLooping)};
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:_finishObserver];
}

@end

typedef NS_OPTIONS(NSUInteger, ABI16_0_0EXAudioInterruptionMode)
{
  ABI16_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI16_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI16_0_0EXAudioInterruptionModeDuckOthers    = 2
};

@interface ABI16_0_0EXAudio ()

@property (nonatomic, assign) int keyCount;
@property (nonatomic, assign) BOOL audioSessionActive;
@property (nonatomic, assign) ABI16_0_0EXAudioInterruptionMode interruptionMode;
@property (nonatomic, assign) BOOL playsInSilentLockedMode;
@property (nonatomic, assign) BOOL allowsRecording;
@property (nonatomic, strong) NSMutableDictionary *playerDataPool;
@property (nonatomic, strong) NSMutableSet *pausedOnBackgroundingSet;
@property (nonatomic, strong) AVAudioRecorder *recorder;
@property (nonatomic, assign) BOOL recorderPreparing;
@property (nonatomic, assign) int recorderDurationMillis;

@end

@implementation ABI16_0_0EXAudio

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _keyCount = 0;
    _playerDataPool = [NSMutableDictionary new];
    _pausedOnBackgroundingSet = [NSMutableSet new];
    _audioSessionActive = NO;
    _interruptionMode = ABI16_0_0EXAudioInterruptionModeMixWithOthers;
    _playsInSilentLockedMode = false;
    _allowsRecording = false;
    _recorder = nil;
    _recorderPreparing = false;
    _recorderDurationMillis = 0;

    AVAudioSession *session = [AVAudioSession sharedInstance];

    // These only need to be set once:

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

- (void)setBridge:(ABI16_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidForeground:)
                                               name:@"ABI16_0_0EXKernelBridgeDidForegroundNotification"
                                             object:_bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidBackground:)
                                               name:@"ABI16_0_0EXKernelBridgeDidBackgroundNotification"
                                             object:_bridge];
}

#pragma mark - Internal Audio Session handling

// This method is placed here so that it is easily referrable from _setAudioSessionCategoryForAudioMode.
- (BOOL)_setAudioMode:(NSDictionary *)mode
         withRejecter:(ABI16_0_0RCTPromiseRejectBlock)rejecter
{
  BOOL playsInSilentLockedMode = ((NSNumber *)mode[@"playsInSilentLockedModeIOS"]).boolValue;
  ABI16_0_0EXAudioInterruptionMode interruptionMode = ((NSNumber *)mode[@"interruptionModeIOS"]).intValue;
  BOOL allowsRecording = ((NSNumber *)mode[@"allowsRecordingIOS"]).boolValue;
  
  if (!playsInSilentLockedMode && interruptionMode == ABI16_0_0EXAudioInterruptionModeDuckOthers) {
    rejecter(@"E_AUDIO_AUDIOMODE", @"Impossible audio mode: playsInSilentLockedMode and duckOthers cannot both be set on iOS.", nil);
    return NO;
  } else if (!playsInSilentLockedMode && allowsRecording) {
    rejecter(@"E_AUDIO_AUDIOMODE", @"Impossible audio mode: playsInSilentLockedMode and allowsRecording cannot both be set on iOS.", nil);
    return NO;
  } else {
    if (!allowsRecording) {
      if (_recorder && [_recorder isRecording]) {
        [_recorder pause];
      }
    }
    
    _playsInSilentLockedMode = playsInSilentLockedMode;
    _interruptionMode = interruptionMode;
    _allowsRecording = allowsRecording;
    
    NSError *error;
    if (_audioSessionActive) {
      [self _setAudioSessionCategoryForAudioMode:&error];
    }
    
    if (error) {
      rejecter(@"E_AUDIO_AUDIOMODE", @"Audio mode set correctly, but an error occurred while setting AVAudioSesionCategory.", error);
      return NO;
    }
    return YES;
  }
}

- (void)_setAudioSessionCategoryForAudioMode:(NSError **)error
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  
  if (!_playsInSilentLockedMode) {
    // _allowsRecording is guaranteed to be false, and _interruptionMode is guaranteed to not be ABI16_0_0EXAudioInterruptionModeDuckOthers (see above)
    if (_interruptionMode == ABI16_0_0EXAudioInterruptionModeDoNotMix) {
      [session setCategory:AVAudioSessionCategorySoloAmbient error:error];
    } else {
      [session setCategory:AVAudioSessionCategoryAmbient error:error];
    }
  } else {
    NSString *category = _allowsRecording ? AVAudioSessionCategoryPlayAndRecord : AVAudioSessionCategoryPlayback;
    switch (_interruptionMode) {
      case ABI16_0_0EXAudioInterruptionModeDoNotMix:
        [session setCategory:category error:error];
        break;
      case ABI16_0_0EXAudioInterruptionModeDuckOthers:
        [session setCategory:category withOptions:AVAudioSessionCategoryOptionDuckOthers error:error];
        break;
      case ABI16_0_0EXAudioInterruptionModeMixWithOthers:
      default:
        [session setCategory:category withOptions:AVAudioSessionCategoryOptionMixWithOthers error:error];
        break;
    }
  }
}

- (NSError *)_activateAudioSessionIfNecessary
{
  if (_audioSessionActive) {
    return nil;
  }
  NSError *error;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setActive:YES error:&error];
  if (!error) {
    _audioSessionActive = YES;
    [self _setAudioSessionCategoryForAudioMode:&error];
  }
  return error;
}

- (NSError *)_deactivateAudioSession
{
  if (!_audioSessionActive) {
    return nil;
  }
  // We must have all players and recorders paused in order to effectively deactivate the session.
  for (ABI16_0_0EXAudioPlayerData *data in [_playerDataPool allValues]) {
    [data.player pause];
  }
  if (_recorder && [_recorder isRecording]) {
    [_recorder pause];
  }
  NSError *error;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  // Restore the AVAudioSession to the system default for proper sandboxing.
  [session setCategory:AVAudioSessionCategorySoloAmbient error:&error];
  [session setActive:NO error:&error];
  if (!error) {
    _audioSessionActive = NO;
  }
  return error;
}

- (NSError *)_deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying
{
  for (ABI16_0_0EXAudioPlayerData *data in [_playerDataPool allValues]) {
    if ([data isPlayerPlaying]) {
      return nil;
    }
  }
  if (_recorder && ([_recorder isRecording] || _recorderPreparing)) {
    return nil;
  }
  return [self _deactivateAudioSession];
}

- (void)_bridgeDidForeground:(NSNotification *)notification
{
  if ([_pausedOnBackgroundingSet count] > 0) {
    NSError *error = [self _activateAudioSessionIfNecessary];
    if (!error) {
      for (NSNumber *key in _pausedOnBackgroundingSet) {
        ABI16_0_0EXAudioPlayerData *data = _playerDataPool[key];
        [data playPlayerWithRate];
      }
    }
    [_pausedOnBackgroundingSet removeAllObjects];
  }
}

- (void)_bridgeDidBackground:(NSNotification *)notification
{
  for (NSNumber *key in [_playerDataPool allKeys]) {
    ABI16_0_0EXAudioPlayerData *data = _playerDataPool[key];
    if ([data isPlayerPlaying]) {
      [_pausedOnBackgroundingSet addObject:key];
      [data.player pause];
    }
  }
  [self _deactivateAudioSession];
}

- (void)_handleAudioSessionInterruption:(NSNotification*)notification
{
  NSNumber *interruptionType = [[notification userInfo] objectForKey:AVAudioSessionInterruptionTypeKey];
  switch (interruptionType.unsignedIntegerValue) {
    case AVAudioSessionInterruptionTypeBegan:{
      // Audio has stopped, session is already inactive
      _audioSessionActive = NO;
      [_pausedOnBackgroundingSet removeAllObjects];
    } break;
    case AVAudioSessionInterruptionTypeEnded:{
      // play must be called again.
    } break;
    default:
      break;
  }
}

- (void)_handleMediaServicesReset
{
  // See here: https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
  
  _audioSessionActive = NO;
  [_pausedOnBackgroundingSet removeAllObjects];
  
  for (__block ABI16_0_0EXAudioPlayerData *data in [_playerDataPool allValues]) {
    [self _createPlayerForUrl:data.url completion:^(AVPlayer *player) {
      data.player = player;
      if (data.shouldCorrectPitch) { // Volume, muted, and seek must be reset through the JS.
        data.player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmLowQualityZeroLatency;
      } else {
        data.player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmVarispeed;
      }
      [data addFinishObserverForNewPlayer];
    }];
  }
  
  if (_recorder) {
    [self _createNewRecorder];
    [_recorder prepareToRecord];
  }
}

#pragma mark - Internal playback helper methods

- (void)_createPlayerForUrl:(NSURL *)url completion:(void (^_Nonnull)(AVPlayer *player))completion
{
  AVURLAsset *avAsset = [AVURLAsset URLAssetWithURL:url options:nil];

  // unless we preload, the asset will not necessarily load the duration by the time we try to play it.
  // http://stackoverflow.com/questions/20581567/avplayer-and-avfoundationerrordomain-code-11819
  [avAsset loadValuesAsynchronouslyForKeys:@[ @"duration" ] completionHandler:^{
    AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:avAsset];
    completion([AVPlayer playerWithPlayerItem:playerItem]);
  }];
}

- (void)_runBlock:(void (^)(ABI16_0_0EXAudioPlayerData *data))block
withPlayerDataForKey:(nonnull NSNumber *)key
     withRejecter:(ABI16_0_0RCTPromiseRejectBlock)reject
{
  ABI16_0_0EXAudioPlayerData *data = _playerDataPool[key];
  if (data) {
    block(data);
  } else {
    reject(@"E_AUDIO_NOPLAYER", @"Player does not exist.", nil);
  }
}

- (void)_removePlayerForKey:(NSNumber *)key
{
  ABI16_0_0EXAudioPlayerData *data = _playerDataPool[key];
  if (data) {
    [data.player pause];
    [self _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
  }
  [_pausedOnBackgroundingSet removeObject:key];
  _playerDataPool[key] = nil;
}

#pragma mark - Internal recording helper methods

- (void)_createNewRecorder
{
  [self _removeRecorder];
  
  NSString *filename = [NSString stringWithFormat:@"recording-%@.caf", [[NSUUID UUID] UUIDString]];
  [ABI16_0_0EXFileSystem ensureDirExistsWithPath:[self.bridge.experienceScope scopedPathWithPath:@"Audio"
                                                                            withOptions:@{@"cache": @YES}]];
  NSString *soundFilePath = [self.bridge.experienceScope scopedPathWithPath:[@"Audio" stringByAppendingPathComponent:filename]
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
    _recorder = recorder;
  }
}

- (int)_getDurationMillisOfRecordingRecorder
{
  return _recorder ? (int) (_recorder.currentTime * 1000) : 0;
}

- (NSDictionary *)_getRecorderStatus
{
  if (_recorder) {
    int durationMillisFromRecorder = [self _getDurationMillisOfRecordingRecorder];
    // After stop, the recorder's duration goes to zero, so we replace it with the correct duration in this case.
    int durationMillis = durationMillisFromRecorder == 0 ? _recorderDurationMillis : durationMillisFromRecorder;
    return @{@"isRecording": @([_recorder isRecording]),
             @"durationMillis": @(durationMillis)};
  } else {
    return @{};
  }
}

- (BOOL)_checkRecorderExistsOrReject:(ABI16_0_0RCTPromiseRejectBlock)reject
{
  if (_recorder == nil) {
    reject(@"E_AUDIO_NORECORDER", @"Recorder does not exist.", nil);
  }
  return _recorder != nil;
}

- (void)_removeRecorder
{
  if (_recorder) {
    [_recorder stop];
    [self _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
    _recorder = nil;
  }
}

#pragma mark - Audio API

ABI16_0_0RCT_EXPORT_MODULE(ExponentAudio);

#pragma mark - Audio API: Global settings

ABI16_0_0RCT_EXPORT_METHOD(setIsEnabled:(BOOL)value
                      resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                      rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  // The JS side prevents any calls from coming through if Audio is disabled,
  // so we just need to stop audio in native when the flag is unset.
  if (!value) {
    [_pausedOnBackgroundingSet removeAllObjects];
    [self _deactivateAudioSession];
  }
  resolve(nil);
}

ABI16_0_0RCT_EXPORT_METHOD(setAudioMode:(nonnull NSDictionary *)mode
                  resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _setAudioMode:mode withRejecter:reject]) {
    resolve(nil);
  } // Otherwise, the internal method has already rejected the promise.
}

#pragma mark - Audio API: Sample playback

ABI16_0_0RCT_EXPORT_METHOD(load:(NSString *)uriString
              resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
              rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:uriString];
  __weak __typeof__(self) weakSelf = self;
  [self _createPlayerForUrl:url completion:^(AVPlayer *player) {
    if (player) {
      NSNumber *key = @(_keyCount++);
      ABI16_0_0EXAudioPlayerData *data = [[ABI16_0_0EXAudioPlayerData alloc] initWithPlayer:player
                                                                  withURL:url
                                                              withLooping:NO
                                                      withPitchCorrection:NO
                                                                 withRate:@(1)
                                               withInternalFinishCallback:^() {
                                                 [weakSelf _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
                                               }];
      _playerDataPool[key] = data;
      resolve(@{@"key": key,
                @"durationMillis": @((int) (CMTimeGetSeconds(player.currentItem.asset.duration) * 1000)),
                @"status": [data getStatus]});
    } else {
      reject(@"E_AUDIO_PLAYERNOTCREATED", @"Load encountered an error: player not created.", nil);
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)key
              resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
              rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    NSError *error = [self _activateAudioSessionIfNecessary];
    if (!error) {
      [data playPlayerWithRate];
    }
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(pause:(nonnull NSNumber *)key
               resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
               rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    [data.player pause];
    [self _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(stop:(nonnull NSNumber *)key
              resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
              rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    [data.player pause];
    [data.player seekToTime:kCMTimeZero completionHandler:^(BOOL finished) {
      [self _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
      resolve(@{@"status": [data getStatus]});
    }];
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(unload:(nonnull NSNumber *)key
                resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    [self _removePlayerForKey:key];
    resolve(nil);
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(setPosition:(nonnull NSNumber *)key
                     toMillis:(nonnull NSNumber *)millis
                     resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                     rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    [data.player seekToTime:CMTimeMake(millis.intValue, 1000) completionHandler:^(BOOL finished) {
      if (finished) {
        resolve(@{@"status": [data getStatus]});
      } else {
        reject(@"E_AUDIO_SEEKING", @"Seeking interrupted.", nil); // TODO : I don't reject for play not working.... should I reject for this?
      }
    }];
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(setRate:(nonnull NSNumber *)key
                  toValue:(nonnull NSNumber *)value
      withPitchCorrection:(BOOL)shouldCorrectPitch
                 resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    if ([data isPlayerPlaying]) {
      data.player.rate = value.floatValue;
    }
    if (shouldCorrectPitch) {
      data.player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmLowQualityZeroLatency;
    } else {
      data.player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmVarispeed;
    }
    data.rate = value;
    data.shouldCorrectPitch = shouldCorrectPitch;
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(setVolume:(nonnull NSNumber *)key
                    toValue:(nonnull NSNumber *)value
                   resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                   rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    data.player.volume = value.floatValue;
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(setIsMuted:(nonnull NSNumber *)key
                     toValue:(BOOL)value
                    resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                    rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    data.player.muted = value;
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(setIsLooping:(nonnull NSNumber *)key
                       toValue:(BOOL)value
                      resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                      rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    data.isLooping = value;
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(getStatus:(nonnull NSNumber *)key
                   resolver:(ABI16_0_0RCTPromiseResolveBlock)resolve
                   rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI16_0_0EXAudioPlayerData *data) {
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

ABI16_0_0RCT_EXPORT_METHOD(setPlaybackFinishedCallback:(nonnull NSNumber *)key
                                 withCallback:(ABI16_0_0RCTResponseSenderBlock)callback)
{
  ABI16_0_0EXAudioPlayerData *data = _playerDataPool[key];
  if (data) {
    data.finishCallback = callback;
  }
}

#pragma mark - Audio API: Recording

ABI16_0_0RCT_EXPORT_METHOD(prepareToRecord:(ABI16_0_0RCTPromiseResolveBlock)resolve
                         rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  [self _createNewRecorder];
  
  if (_recorder) {
    _recorderPreparing = true;
    NSError *error = [self _activateAudioSessionIfNecessary];
    if (!error && [_recorder prepareToRecord]) {
      resolve(@{@"uri": [[_recorder url] absoluteString],
                @"status": [self _getRecorderStatus]});
    } else {
      reject(@"E_AUDIO_RECORDERNOTCREATED", @"Prepare encountered an error: recorder not prepared.", nil);
    }
    _recorderPreparing = false;
    [self _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
  } else {
    reject(@"E_AUDIO_RECORDERNOTCREATED", @"Prepare encountered an error: recorder not created.", nil);
  }
}

ABI16_0_0RCT_EXPORT_METHOD(startRecording:(ABI16_0_0RCTPromiseResolveBlock)resolve
                        rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkRecorderExistsOrReject:reject]) {
    if (!_allowsRecording) {
      reject(@"E_AUDIO_AUDIOMODE", @"Recording not allowed on iOS.", nil);
    } else if (!_recorder.recording) {
      NSError *error = [self _activateAudioSessionIfNecessary];
      if (!error) {
        if ([_recorder record]) {
          resolve(@{@"status": [self _getRecorderStatus]});
        } else {
          reject(@"E_AUDIO_RECORDING", @"Start encountered an error: recording not started.", nil);
        }
      } else {
        reject(@"E_AUDIO_RECORDING", @"Start encountered an error: audio session not activated.", error);
      }
    }
  }
}

ABI16_0_0RCT_EXPORT_METHOD(pauseRecording:(ABI16_0_0RCTPromiseResolveBlock)resolve
                        rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkRecorderExistsOrReject:reject]) {
    if (_recorder.recording) {
      [_recorder pause];
      [self _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
    }
    resolve(@{@"status": [self _getRecorderStatus]});
  }
}

ABI16_0_0RCT_EXPORT_METHOD(stopRecording:(ABI16_0_0RCTPromiseResolveBlock)resolve
                       rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkRecorderExistsOrReject:reject]) {
    if (_recorder.recording) {
      _recorderDurationMillis = [self _getDurationMillisOfRecordingRecorder];
      [_recorder stop];
      [self _deactivateAudioSessionIfRecorderDormantAndNoPlayersPlaying];
    }
    resolve(@{@"status": [self _getRecorderStatus]});
  }
}

ABI16_0_0RCT_EXPORT_METHOD(getRecordingStatus:(ABI16_0_0RCTPromiseResolveBlock)resolve
                            rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkRecorderExistsOrReject:reject]) {
    resolve(@{@"status": [self _getRecorderStatus]});
  }
}

ABI16_0_0RCT_EXPORT_METHOD(unloadRecorder:(ABI16_0_0RCTPromiseResolveBlock)resolve
                                  rejecter:(ABI16_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _checkRecorderExistsOrReject:reject]) {
    [self _removeRecorder];
    resolve(nil);
  }
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  // This will clear all @properties and deactivate the audio session:
  [self _removeRecorder];
  for (NSNumber *key in [_playerDataPool allKeys]) {
    [self _removePlayerForKey:key];
  }
}


@end
