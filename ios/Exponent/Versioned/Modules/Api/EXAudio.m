// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <React/RCTAssert.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

#import "EXAudio.h"
#import "EXUnversioned.h"

@interface EXAudioPlayerData: NSObject

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) NSNumber *rate;
@property (nonatomic, strong) id <NSObject> finishObserver;
@property (nonatomic, strong) RCTResponseSenderBlock finishCallback;
@property (nonatomic, strong) void (^internalFinishCallback)();
@property (nonatomic, assign) BOOL isLooping;
@property (nonatomic, assign) BOOL shouldCorrectPitch;

@end

@implementation EXAudioPlayerData

- (instancetype)initWithPlayer:(AVPlayer *)player
                   withLooping:(BOOL)isLooping
           withPitchCorrection:(BOOL)shouldCorrectPitch
                      withRate:(NSNumber *)rate
    withInternalFinishCallback:(void (^)())internalFinishCallback
{
  _player = player;
  _finishCallback = nil;
  _internalFinishCallback = internalFinishCallback; // TODO: @terribleben, I need to keep this around, right?
  _isLooping = isLooping;
  _shouldCorrectPitch = shouldCorrectPitch;
  _rate = rate;
  
  __weak __typeof__(self) weakSelf = self;
  void (^didPlayToEndTimeObserverBlock)(NSNotification *note) = ^(NSNotification *note) {
    if (weakSelf.isLooping) {
      [weakSelf.player seekToTime:kCMTimeZero];
      [weakSelf playPlayerWithRate];
    } else {
      weakSelf.internalFinishCallback();
      RCTResponseSenderBlock callback = weakSelf.finishCallback;
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
  return self;
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

@interface EXAudio ()

@property (nonatomic, assign) int keyCount;
@property (nonatomic, assign) BOOL audioSessionActive;
@property (nonatomic, strong) NSMutableDictionary *playerDataPool;
@property (nonatomic, strong) NSMutableSet *pausedOnBackgroundingSet;

@end

@implementation EXAudio

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _keyCount = 0;
    _playerDataPool = [NSMutableDictionary new];
    _pausedOnBackgroundingSet = [NSMutableSet new];
    _audioSessionActive = NO;

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

- (void)setBridge:(RCTBridge *)bridge
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



#pragma mark - Internal

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
    [session setCategory:AVAudioSessionCategoryAmbient error:nil];
  }
  return error;
}

- (NSError *)_deactivateAudioSession
{
  if (!_audioSessionActive) {
    return nil;
  }
  // We must have all players paused in order to effectively deactivate the session.
  for (EXAudioPlayerData *data in [_playerDataPool allValues]) {
    [data.player pause];
  }
  NSError *error;
  [[AVAudioSession sharedInstance] setActive:NO error:&error];
  if (!error) {
    _audioSessionActive = NO;
  }
  return error;
}

- (NSError *)_deactivateAudioSessionIfNoPlayersPlaying
{
  for (EXAudioPlayerData *data in [_playerDataPool allValues]) {
    if ([data isPlayerPlaying]) {
      return nil;
    }
  }
  return [self _deactivateAudioSession];
}

- (void)_bridgeDidForeground:(NSNotification *)notification
{
  if ([_pausedOnBackgroundingSet count] > 0) {
    NSError *error = [self _activateAudioSessionIfNecessary];
    if (!error) {
      for (NSNumber *key in _pausedOnBackgroundingSet) {
        EXAudioPlayerData *data = _playerDataPool[key];
        [data playPlayerWithRate];
      }
    }
    [_pausedOnBackgroundingSet removeAllObjects];
  }
}

- (void)_bridgeDidBackground:(NSNotification *)notification
{
  for (NSNumber *key in [_playerDataPool allKeys]) {
    EXAudioPlayerData *data = _playerDataPool[key];
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
  _audioSessionActive = NO;
  // TODO : reset all objects according to https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
}

- (void)_runBlock:(void (^)(EXAudioPlayerData *data))block
withPlayerDataForKey:(nonnull NSNumber *)key
        withRejecter:(RCTPromiseRejectBlock)reject
{
  EXAudioPlayerData *data = _playerDataPool[key];
  if (data) {
    block(data);
  } else {
    reject(@"E_AUDIO_NOPLAYER", @"Player does not exist.", nil);
  }
}

- (void)_removePlayerForKey:(NSNumber *)key
{
  EXAudioPlayerData *data = _playerDataPool[key];
  if (data) {
    [data.player pause];
    [self _deactivateAudioSessionIfNoPlayersPlaying];
  }
  [_pausedOnBackgroundingSet removeObject:key];
  _playerDataPool[key] = nil;
}

#pragma mark - Audio API

RCT_EXPORT_MODULE(ExponentAudio);

RCT_EXPORT_METHOD(setIsEnabled:(BOOL)value
                      resolver:(RCTPromiseResolveBlock)resolve
                      rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!value) {
    [_pausedOnBackgroundingSet removeAllObjects];
    [self _deactivateAudioSession];
  }
  resolve(nil);
}

RCT_EXPORT_METHOD(load:(NSString *)uriString
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:uriString];
  AVURLAsset *avAsset = [AVURLAsset URLAssetWithURL:url options:nil];
  AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:avAsset];
  AVPlayer *player = [AVPlayer playerWithPlayerItem:playerItem];
  if (player) {
    NSNumber *key = @(_keyCount++);
    
    __weak __typeof__(self) weakSelf = self;
    EXAudioPlayerData *data = [[EXAudioPlayerData alloc] initWithPlayer:player
                                                            withLooping:NO
                                                    withPitchCorrection:NO
                                                               withRate:@(1)
                                             withInternalFinishCallback:^() {
                                               [weakSelf _deactivateAudioSessionIfNoPlayersPlaying];
                                             }];
    _playerDataPool[key] = data;
    resolve(@{@"key": key,
              @"durationMillis": @((int) (CMTimeGetSeconds(avAsset.duration) * 1000)),
              @"status": [data getStatus]});
  } else {
    reject(@"E_AUDIO_PLAYERNOTCREATED", @"Load encountered an error: player not created.", nil);
  }
}

RCT_EXPORT_METHOD(play:(nonnull NSNumber *)key
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    NSError *error = [self _activateAudioSessionIfNecessary];
    if (!error) {
      [data playPlayerWithRate];
    }
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(pause:(nonnull NSNumber *)key
               resolver:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    [data.player pause];
    [self _deactivateAudioSessionIfNoPlayersPlaying];
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(stop:(nonnull NSNumber *)key
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    [data.player pause];
    [data.player seekToTime:kCMTimeZero completionHandler:^(BOOL finished) {
      [self _deactivateAudioSessionIfNoPlayersPlaying];
      resolve(@{@"status": [data getStatus]});
    }];
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(unload:(nonnull NSNumber *)key
                resolver:(RCTPromiseResolveBlock)resolve
                rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    [self _removePlayerForKey:key];
    resolve(nil);
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(setPosition:(nonnull NSNumber *)key
                     toMillis:(nonnull NSNumber *)millis
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    [data.player seekToTime:CMTimeMake(millis.intValue, 1000) completionHandler:^(BOOL finished) {
      if (finished) {
        resolve(@{@"status": [data getStatus]});
      } else {
        reject(0, @"Seeking interrupted.", nil);
      }
    }];
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(setRate:(nonnull NSNumber *)key
                  toValue:(nonnull NSNumber *)value
      withPitchCorrection:(BOOL)shouldCorrectPitch
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    if ([data isPlayerPlaying]) {
      data.player.rate = value.floatValue; // TODO
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

RCT_EXPORT_METHOD(setVolume:(nonnull NSNumber *)key
                    toValue:(nonnull NSNumber *)value
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    data.player.volume = value.floatValue;
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(setIsMuted:(nonnull NSNumber *)key
                     toValue:(BOOL)value
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    data.player.muted = value;
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(setIsLooping:(nonnull NSNumber *)key
                       toValue:(BOOL)value
                      resolver:(RCTPromiseResolveBlock)resolve
                      rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    data.isLooping = value;
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(getStatus:(nonnull NSNumber *)key
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAudioPlayerData *data) {
    resolve(@{@"status": [data getStatus]});
  } withPlayerDataForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(setPlaybackFinishedCallback:(nonnull NSNumber *)key
                                 withCallback:(RCTResponseSenderBlock)callback)
{
  EXAudioPlayerData *data = _playerDataPool[key];
  if (data) {
    data.finishCallback = callback;
  }
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  for (NSNumber *key in [_playerDataPool allKeys]) {
    [self _removePlayerForKey:key]; // This will clear all @properties and deactivate the audio session.
  }
}


@end
