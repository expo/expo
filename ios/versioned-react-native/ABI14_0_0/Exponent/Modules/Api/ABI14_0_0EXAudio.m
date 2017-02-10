// Copyright 2016-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ReactABI14_0_0/ABI14_0_0RCTAssert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTUtils.h>

#import "ABI14_0_0EXAudio.h"
#import "ABI14_0_0EXUnversioned.h"

@interface ABI14_0_0EXAudio ()

@property (nonatomic, assign) int keyCount;
@property (nonatomic, assign) BOOL enabled;
@property (nonatomic, assign) BOOL midInterruption;
@property (nonatomic, assign) BOOL backgrounded;
@property (nonatomic, strong) NSMutableDictionary *playerPool;
@property (nonatomic, strong) NSMutableDictionary *finishObserverPool;
@property (nonatomic, strong) NSMutableDictionary *finishCallbackPool;
@property (nonatomic, strong) NSMutableSet *loopSet;
@property (nonatomic, strong) NSMutableSet *pausedOnBackgroundingSet;

@end

@implementation ABI14_0_0EXAudio

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    _keyCount = 0;
    _playerPool = [NSMutableDictionary new];
    _finishObserverPool = [NSMutableDictionary new];
    _finishCallbackPool = [NSMutableDictionary new];
    _loopSet = [NSMutableSet new];
    _pausedOnBackgroundingSet = [NSMutableSet new];
    _enabled = NO;
    _midInterruption = NO;
    _backgrounded = NO;

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

- (void)setBridge:(ABI14_0_0RCTBridge *)bridge
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

- (void)_activateAudioSession:(NSError **)outError
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setActive:YES error:outError];
  [session setCategory:AVAudioSessionCategoryAmbient error:outError];
}

- (void)_deactivateAudioSession:(NSError **)outError
{
  // We must have all players paused in order to effectively deactivate the session.
  for (AVPlayer *player in [_playerPool allValues]) {
    [player pause];
  }
  [[AVAudioSession sharedInstance] setActive:NO error:outError];
}

- (void)_resumeAllPausedOnBackgrounding
{
  for (NSNumber *key in _pausedOnBackgroundingSet) {
    AVPlayer *player = _playerPool[key];
    [player play];
  }
  [_pausedOnBackgroundingSet removeAllObjects];
}

- (void)_bridgeDidForeground:(NSNotification *)notification
{
  _backgrounded = NO;
  if (!_midInterruption && _enabled) {
    NSError *error;
    [self _activateAudioSession:&error];
    if (error) {
      _enabled = NO;
      [_pausedOnBackgroundingSet removeAllObjects];
    } else {
      [self _resumeAllPausedOnBackgrounding];
    }
  }
}

- (void)_bridgeDidBackground:(NSNotification *)notification
{
  _backgrounded = YES;
  if (!_midInterruption && _enabled) {
    for (NSNumber *key in [_playerPool allKeys]) {
      AVPlayer *player = _playerPool[key];
      if ([self _getIsPlaying:player]) {
        [_pausedOnBackgroundingSet addObject:key];
        [player pause];
      }
    }
    [self _deactivateAudioSession:nil];
  }
}

- (void)_handleAudioSessionInterruption:(NSNotification*)notification
{
  NSNumber *interruptionType = [[notification userInfo] objectForKey:AVAudioSessionInterruptionTypeKey];
  switch (interruptionType.unsignedIntegerValue) {
    case AVAudioSessionInterruptionTypeBegan:{
      // Audio has stopped, session is already inactive
      _midInterruption = YES;
    } break;
    case AVAudioSessionInterruptionTypeEnded:{
      _midInterruption = NO;
      if (!_backgrounded && _enabled) {
        NSError *error;
        [self _activateAudioSession:&error];
        if (error) {
          _enabled = NO;
          [_pausedOnBackgroundingSet removeAllObjects];
        } else {
          [self _resumeAllPausedOnBackgrounding]; // In case we were interrupted while backgrounded.
        }
      }
    } break;
    default:
      break;
  }
}

- (void)_handleMediaServicesReset
{
  if (_enabled && !_midInterruption && !_backgrounded) {
    [self _activateAudioSession:nil];
  }
  // TODO : reset all objects according to https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
}

- (void)_setIsLooping:(nonnull NSNumber *)key
              toValue:(BOOL)value
{
  if (value) {
    [_loopSet addObject:key];
  } else {
    [_loopSet removeObject:key];
  }
}

- (BOOL)_getIsLooping:(nonnull NSNumber *)key
{
  return [_loopSet containsObject:key];
}

- (BOOL)_getIsPlaying:(AVPlayer *)player
{
  if ([player respondsToSelector:@selector(timeControlStatus)]) {
    // Only available after iOS 10
    return [player timeControlStatus] == AVPlayerTimeControlStatusPlaying;
  } else {
    // timeControlStatus is preferable to this when available
    // See http://stackoverflow.com/questions/5655864/check-play-state-of-avplayer
    return (player.rate != 0) && (player.error == nil);
  }
}

- (NSDictionary *)_getStatusForKey:(NSNumber *)key
{
  AVPlayer *player = _playerPool[key];
  if (player) {
    Float64 seconds = CMTimeGetSeconds([player currentTime]);
    seconds = seconds < 0 ? 0 : seconds; // Sometimes [player currentTime] erroneously returns a negative value when actually at zero.
    return @{@"position_millis": @((int) (seconds * 1000)),
             @"is_playing": @([self _getIsPlaying:player]),
             @"is_muted": @(player.muted),
             @"is_looping": @([self _getIsLooping:key])};
  }
  return @{};
}

- (void)_runIfEnabled:(void (^)())block
         withRejecter:(ABI14_0_0RCTPromiseRejectBlock)reject
{
  // If we are enabled but otherwise backgrounded or mid-interruption, the audio session will be inactive, so certain operations will be impossible.
  // We allow these operations to fail because the audio session is inactive, and allow all other operations to proceed as normal.
  if (_enabled) {
    block();
  } else {
    reject(@"E_AUDIO_DISABLED", @"Exponent Audio not enabled.", nil);
  }
}

- (void)_runWithPlayerIfEnabled:(void (^)(AVPlayer *player))block
                        withKey:(nonnull NSNumber *)key
                   withRejecter:(ABI14_0_0RCTPromiseRejectBlock)reject
{
  [self _runIfEnabled:^{
    AVPlayer *player = _playerPool[key];
    if (player) {
      block(player);
    } else {
      reject(@"E_AUDIO_NOPLAYER", @"Player does not exist.", nil);
    }
  } withRejecter:reject];
}

- (void)_releaseForKey:(NSNumber *)key
{
  AVPlayer *player = _playerPool[key];
  if (player) {
    [player pause];
  }
  id <NSObject> loopObserver = _finishObserverPool[key];
  if (loopObserver) {
    [[NSNotificationCenter defaultCenter] removeObserver:loopObserver];
  }
  _finishObserverPool[key] = nil;
  _finishCallbackPool[key] = nil;
  [_loopSet removeObject:key];
  [_pausedOnBackgroundingSet removeObject:key];
  _playerPool[key] = nil;
}

#pragma mark - Audio API

ABI14_0_0RCT_EXPORT_MODULE(ExponentAudio);

ABI14_0_0RCT_EXPORT_METHOD(setIsEnabled:(BOOL)value
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  NSError *error;
  if (value == _enabled) {
    resolve(nil); // There is no change in state.
  } else if (value) {
    if (_midInterruption || _backgrounded) { // The audio session is inactive and will ReactABI14_0_0ivate when the interruption ends.
      _enabled = YES;
      resolve(nil);
    } else {
      [self _activateAudioSession:&error];
      if (error) {
        reject(@"E_AUDIO_ENABLEERROR", @"Could not enable Exponent Audio.", error);
        [_pausedOnBackgroundingSet removeAllObjects];
      } else {
        _enabled = YES;
        [self _resumeAllPausedOnBackgrounding]; // In case we disabled while backgrounded.
        resolve(nil);
      }
    }
  } else {
    if (_midInterruption || _backgrounded) { // The audio session is inactive and nothing is playing.
      _enabled = NO;
      resolve(nil);
    } else {
      [self _deactivateAudioSession:&error];
      if (error) {
        reject(@"E_AUDIO_DISABLEERROR", @"Could not disable Exponent Audio.", error);
      } else {
        _enabled = NO;
        resolve(nil);
      }
    }
  }
}

ABI14_0_0RCT_EXPORT_METHOD(load:(NSString *)uriString
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runIfEnabled:^{
    NSURL *url = [NSURL URLWithString:uriString];
    AVURLAsset *avAsset = [AVURLAsset URLAssetWithURL:url options:nil];
    AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:avAsset];
    AVPlayer *player = [AVPlayer playerWithPlayerItem:playerItem];
    if (player) {
      NSNumber *key = @(_keyCount++);
      _playerPool[key] = player;
      [self _setIsLooping:key toValue:false];

      __weak __typeof__(self) weakSelf = self;
      void (^didPlayToEndTimeObserverBlock)(NSNotification *note) = ^(NSNotification *note) {
        if ([weakSelf _getIsLooping:key]) {
          [player seekToTime:kCMTimeZero];
          [player play];
        } else {
          ABI14_0_0RCTResponseSenderBlock callback = _finishCallbackPool[key];
          _finishCallbackPool[key] = nil;
          if (callback) {
            callback(@[[weakSelf _getStatusForKey:key]]);
          }
        }
      };
      _finishObserverPool[key] = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemDidPlayToEndTimeNotification
                                                                                   object:[player currentItem]
                                                                                    queue:nil
                                                                               usingBlock:didPlayToEndTimeObserverBlock];

      resolve(@{@"key": key,
                @"duration_millis": @((int) (CMTimeGetSeconds(avAsset.duration) * 1000)),
                @"status": [self _getStatusForKey:key]});
    } else {
      reject(@"E_AUDIO_PLAYERNOTCREATED", @"Load encountered an error: player not created.", nil);
    }
  } withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)key
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    [player play];
    resolve(@{@"status": [self _getStatusForKey:key]});
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(pause:(nonnull NSNumber *)key
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    [player pause];
    resolve(@{@"status": [self _getStatusForKey:key]});
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(stop:(nonnull NSNumber *)key
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    [player pause];
    [player seekToTime:kCMTimeZero completionHandler:^(BOOL finished) {
      resolve(@{@"status": [self _getStatusForKey:key]});
    }];
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(unload:(nonnull NSNumber *)key
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    [self _releaseForKey:key];
    resolve(nil);
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(setPosition:(nonnull NSNumber *)key
                  toMillis:(nonnull NSNumber *)millis
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    [player seekToTime:CMTimeMake(millis.intValue, 1000) completionHandler:^(BOOL finished) {
      if (finished) {
        resolve(@{@"status": [self _getStatusForKey:key]});
      } else {
        reject(0, @"Seeking interrupted.", nil);
      }
    }];
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(setVolume:(nonnull NSNumber *)key
                  toValue:(nonnull NSNumber *)value
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  if (value.doubleValue < 0.0 || value.doubleValue > 1.0) {
    reject(@"E_AUDIO_INCORRECTPARAMETERS", @"Volume value must be between 0.0 and 1.0.", nil);
    return;
  }
  
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    player.volume = value.floatValue;
    resolve(@{@"status": [self _getStatusForKey:key]});
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(setIsMuted:(nonnull NSNumber *)key
                  toValue:(BOOL)value
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    player.muted = value;
    resolve(@{@"status": [self _getStatusForKey:key]});
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(setIsLooping:(nonnull NSNumber *)key
                  toValue:(BOOL)value
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    [self _setIsLooping:key toValue:value];
    resolve(@{@"status": [self _getStatusForKey:key]});
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(getStatus:(nonnull NSNumber *)key
                  resolver:(ABI14_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI14_0_0RCTPromiseRejectBlock)reject)
{
  [self _runWithPlayerIfEnabled:^(AVPlayer *player) {
    resolve(@{@"status": [self _getStatusForKey:key]});
  } withKey:key withRejecter:reject];
}

ABI14_0_0RCT_EXPORT_METHOD(setPlaybackFinishedCallback:(nonnull NSNumber *)key
                  withCallback:(ABI14_0_0RCTResponseSenderBlock)callback)
{
  if (_enabled) {
    AVPlayer *player = _playerPool[key];
    if (player) {
      _finishCallbackPool[key] = callback;
    }
  }
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  for (NSNumber *key in [_playerPool allKeys]) {
    [self _releaseForKey:key];
  }
  [self _deactivateAudioSession:nil];
}


@end
