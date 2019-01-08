// Copyright 2017-present 650 Industries. All rights reserved.

#import <React/RCTUtils.h>

#import "EXAVPlayerData.h"

NSString *const EXAVPlayerDataStatusIsLoadedKeyPath = @"isLoaded";
NSString *const EXAVPlayerDataStatusURIKeyPath = @"uri";
NSString *const EXAVPlayerDataStatusHeadersKeyPath = @"headers";
NSString *const EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath = @"progressUpdateIntervalMillis";
NSString *const EXAVPlayerDataStatusDurationMillisKeyPath = @"durationMillis";
NSString *const EXAVPlayerDataStatusPositionMillisKeyPath = @"positionMillis";
NSString *const EXAVPlayerDataStatusSeekMillisToleranceBeforeKeyPath = @"seekMillisToleranceBefore";
NSString *const EXAVPlayerDataStatusSeekMillisToleranceAfterKeyPath = @"seekMillisToleranceAfter";
NSString *const EXAVPlayerDataStatusPlayableDurationMillisKeyPath = @"playableDurationMillis";
NSString *const EXAVPlayerDataStatusShouldPlayKeyPath = @"shouldPlay";
NSString *const EXAVPlayerDataStatusIsPlayingKeyPath = @"isPlaying";
NSString *const EXAVPlayerDataStatusIsBufferingKeyPath = @"isBuffering";
NSString *const EXAVPlayerDataStatusRateKeyPath = @"rate";
NSString *const EXAVPlayerDataStatusShouldCorrectPitchKeyPath = @"shouldCorrectPitch";
NSString *const EXAVPlayerDataStatusVolumeKeyPath = @"volume";
NSString *const EXAVPlayerDataStatusIsMutedKeyPath = @"isMuted";
NSString *const EXAVPlayerDataStatusIsLoopingKeyPath = @"isLooping";
NSString *const EXAVPlayerDataStatusDidJustFinishKeyPath = @"didJustFinish";
NSString *const EXAVPlayerDataStatusHasJustBeenInterruptedKeyPath = @"hasJustBeenInterrupted";

NSString *const EXAVPlayerDataObserverStatusKeyPath = @"status";
NSString *const EXAVPlayerDataObserverRateKeyPath = @"rate";
NSString *const EXAVPlayerDataObserverCurrentItemKeyPath = @"currentItem";
NSString *const EXAVPlayerDataObserverTimeControlStatusPath = @"timeControlStatus";
NSString *const EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath = @"playbackBufferEmpty";

@interface EXAVPlayerData ()

@property (nonatomic, weak) EXAV *exAV;

@property (nonatomic, assign) BOOL isLoaded;
@property (nonatomic, strong) NSDictionary *headers;
@property (nonatomic, strong) void (^loadFinishBlock)(BOOL success, NSDictionary *successStatus, NSString *error);

@property (nonatomic, strong) id <NSObject> timeObserver;
@property (nonatomic, strong) id <NSObject> finishObserver;
@property (nonatomic, strong) id <NSObject> playbackStalledObserver;

@property (nonatomic, strong) NSNumber *progressUpdateIntervalMillis;
@property (nonatomic, assign) CMTime currentPosition;
@property (nonatomic, assign) BOOL shouldPlay;
@property (nonatomic, strong) NSNumber *rate;
@property (nonatomic, strong) NSNumber *observedRate;
@property (nonatomic, assign) AVPlayerTimeControlStatus timeControlStatus;
@property (nonatomic, assign) BOOL shouldCorrectPitch;
@property (nonatomic, strong) NSNumber* volume;
@property (nonatomic, assign) BOOL isMuted;
@property (nonatomic, assign) BOOL isLooping;
@property (nonatomic, strong) NSArray<AVPlayerItem *> *items;

@property (nonatomic, strong) RCTPromiseResolveBlock replayResolve;

@end

@implementation EXAVPlayerData

#pragma mark - Static methods

+ (NSDictionary *)getUnloadedStatus
{
  return @{EXAVPlayerDataStatusIsLoadedKeyPath: @(NO)};
}

#pragma mark - Init and player loading

- (instancetype)initWithEXAV:(EXAV *)exAV
                  withSource:(NSDictionary *)source
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock
{
  if ((self = [super init])) {
    _exAV = exAV;
  
    _isLoaded = NO;
    _loadFinishBlock = loadFinishBlock;
  
    _player = nil;
  
    _url = [NSURL URLWithString:[source objectForKey:EXAVPlayerDataStatusURIKeyPath]];
    _headers = [self validatedRequestHeaders:source[EXAVPlayerDataStatusHeadersKeyPath]];
  
    _timeObserver = nil;
    _finishObserver = nil;
    _playbackStalledObserver = nil;
    _statusUpdateCallback = nil;
  
    // These status props will be potentially reset by the following call to [self setStatus:parameters ...].
    _progressUpdateIntervalMillis = @(500);
    _currentPosition = kCMTimeZero;
    _timeControlStatus = 0;
    _shouldPlay = NO;
    _rate = @(1.0);
    _observedRate = @(1.0);
    _shouldCorrectPitch = NO;
    _volume = @(1.0);
    _isMuted = NO;
    _isLooping = NO;
  
    [self setStatus:parameters resolver:nil rejecter:nil];
  
    [self _loadNewPlayer];
  }
  
  return self;
}

- (void)_loadNewPlayer
{
  NSArray *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookies];
  AVURLAsset *avAsset = [AVURLAsset URLAssetWithURL:_url options:@{AVURLAssetHTTPCookiesKey : cookies, @"AVURLAssetHTTPHeaderFieldsKey": _headers}];
  
  // unless we preload, the asset will not necessarily load the duration by the time we try to play it.
  // http://stackoverflow.com/questions/20581567/avplayer-and-avfoundationerrordomain-code-11819
  __weak __typeof__(self) weakSelf = self;
  [avAsset loadValuesAsynchronouslyForKeys:@[ @"duration" ] completionHandler:^{
    __weak EXAVPlayerData *strongSelf = weakSelf;
    if (strongSelf) {
      // We prepare three items for AVQueuePlayer, so when the first finishes playing,
      // second can start playing and the third can start preparing to play.
      AVPlayerItem *firstplayerItem = [AVPlayerItem playerItemWithAsset:avAsset];
      AVPlayerItem *secondPlayerItem = [AVPlayerItem playerItemWithAsset:avAsset];
      AVPlayerItem *thirdPlayerItem = [AVPlayerItem playerItemWithAsset:avAsset];
      strongSelf.items = @[firstplayerItem, secondPlayerItem, thirdPlayerItem];
      strongSelf.player = [AVQueuePlayer queuePlayerWithItems:@[firstplayerItem, secondPlayerItem, thirdPlayerItem]];
      if (strongSelf.player) {
        [strongSelf.player addObserver:strongSelf forKeyPath:EXAVPlayerDataObserverStatusKeyPath options:0 context:nil];
        [strongSelf.player.currentItem addObserver:strongSelf forKeyPath:EXAVPlayerDataObserverStatusKeyPath options:0 context:nil];
      } else {
        NSString *errorMessage = @"Load encountered an error: [AVPlayer playerWithPlayerItem:] returned nil.";
        if (strongSelf.loadFinishBlock) {
          strongSelf.loadFinishBlock(NO, nil, errorMessage);
          strongSelf.loadFinishBlock = nil;
        } else if (strongSelf.errorCallback) {
          strongSelf.errorCallback(errorMessage);
        }
      }
    }
  }];
}

- (void)_finishLoadingNewPlayer
{
  // Set up player with parameters
  __weak __typeof__(self) weakSelf = self;
  [_player seekToTime:_currentPosition completionHandler:^(BOOL finished) {
    __strong EXAVPlayerData *strongSelf = weakSelf;
    __strong EXAV *strongEXAV = strongSelf ? strongSelf.exAV : nil;
    if (strongEXAV) {
      dispatch_async(strongEXAV.methodQueue, ^{
        __strong EXAVPlayerData *strongSelfInner = weakSelf;
        if (strongSelfInner) {
          strongSelfInner.currentPosition = strongSelfInner.player.currentTime;

          if (strongSelfInner.shouldCorrectPitch) {
            strongSelfInner.player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmLowQualityZeroLatency;
          } else {
            strongSelfInner.player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmVarispeed;
          }
          strongSelfInner.player.volume = strongSelfInner.volume.floatValue;
          strongSelfInner.player.muted = strongSelfInner.isMuted;
          [strongSelfInner _updateLooping:strongSelfInner.isLooping];

          [strongSelfInner _tryPlayPlayerWithRateAndMuteIfNecessary];

          strongSelfInner.isLoaded = YES;

          [strongSelfInner _addObserversForNewPlayer];

          if (strongSelfInner.loadFinishBlock) {
            strongSelfInner.loadFinishBlock(YES, [strongSelfInner getStatus], nil);
            strongSelfInner.loadFinishBlock = nil;
          }
        }
      });
    }
  }];
}

#pragma mark - setStatus

- (BOOL)_shouldPlayerPlay
{
  return _shouldPlay && ![_rate isEqualToNumber:@(0)];
}

- (NSError *)_tryPlayPlayerWithRateAndMuteIfNecessary
{
  if (_player && [self _shouldPlayerPlay]) {
    NSError *error = [_exAV promoteAudioSessionIfNecessary];
    if (!error) {
      _player.muted = _isMuted;
      _player.rate = [_rate floatValue];
    }
    return error;
  }
  return nil;
}

- (void)_updateLooping:(BOOL)isLooping
{
  _isLooping = isLooping;
  if (_isLooping) {
    [_player setActionAtItemEnd:AVPlayerActionAtItemEndAdvance];
  } else {
    [_player setActionAtItemEnd:AVPlayerActionAtItemEndPause];
  }
}

- (void)setStatus:(NSDictionary *)parameters
         resolver:(RCTPromiseResolveBlock)resolve
         rejecter:(RCTPromiseRejectBlock)reject
{
  BOOL mustUpdateTimeObserver = NO;
  BOOL mustSeek = NO;
  
  if ([parameters objectForKey:EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath] != nil) {
    NSNumber *progressUpdateIntervalMillis = parameters[EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath];
    mustUpdateTimeObserver = ![progressUpdateIntervalMillis isEqualToNumber:_progressUpdateIntervalMillis];
    _progressUpdateIntervalMillis = progressUpdateIntervalMillis;
  }
  
  // To prevent a race condition, we set _currentPosition at the end of this method.
  CMTime newPosition = _currentPosition;
  
  if ([parameters objectForKey:EXAVPlayerDataStatusPositionMillisKeyPath] != nil) {
    NSNumber *currentPositionMillis = parameters[EXAVPlayerDataStatusPositionMillisKeyPath];
    
    // We only seek if the new position is different from _currentPosition by a whole number of milliseconds.
    mustSeek = currentPositionMillis.longValue != [self _getRoundedMillisFromCMTime:_currentPosition].longValue;
    if (mustSeek) {
      newPosition = CMTimeMakeWithSeconds(currentPositionMillis.floatValue / 1000, NSEC_PER_SEC);
    }
  }
  
  // Default values, see: https://developer.apple.com/documentation/avfoundation/avplayer/1388493-seek
  CMTime toleranceBefore = kCMTimePositiveInfinity;
  CMTime toleranceAfter = kCMTimePositiveInfinity;
  
  // We need to set toleranceBefore only if we will seek
  if (mustSeek && [parameters objectForKey:EXAVPlayerDataStatusSeekMillisToleranceBeforeKeyPath] != nil) {
    NSNumber *seekMillisToleranceBefore = parameters[EXAVPlayerDataStatusSeekMillisToleranceBeforeKeyPath];
    toleranceBefore = CMTimeMakeWithSeconds(seekMillisToleranceBefore.floatValue / 1000, NSEC_PER_SEC);
  }
  
  // We need to set toleranceAfter only if we will seek
  if (mustSeek && [parameters objectForKey:EXAVPlayerDataStatusSeekMillisToleranceAfterKeyPath] != nil) {
    NSNumber *seekMillisToleranceAfter = parameters[EXAVPlayerDataStatusSeekMillisToleranceAfterKeyPath];
    toleranceAfter = CMTimeMakeWithSeconds(seekMillisToleranceAfter.floatValue / 1000, NSEC_PER_SEC);
  }
  
  if ([parameters objectForKey:EXAVPlayerDataStatusShouldPlayKeyPath] != nil) {
    NSNumber *shouldPlay = parameters[EXAVPlayerDataStatusShouldPlayKeyPath];
    _shouldPlay = shouldPlay.boolValue;
  }
  
  if ([parameters objectForKey:EXAVPlayerDataStatusRateKeyPath] != nil) {
    NSNumber *rate = parameters[EXAVPlayerDataStatusRateKeyPath];
    _rate = rate;
  }
  if ([parameters objectForKey:EXAVPlayerDataStatusShouldCorrectPitchKeyPath] != nil) {
    NSNumber *shouldCorrectPitch = parameters[EXAVPlayerDataStatusShouldCorrectPitchKeyPath];
    _shouldCorrectPitch = shouldCorrectPitch.boolValue;
  }
  if ([parameters objectForKey:EXAVPlayerDataStatusVolumeKeyPath] != nil) {
    NSNumber *volume = parameters[EXAVPlayerDataStatusVolumeKeyPath];
    _volume = volume;
  }
  if ([parameters objectForKey:EXAVPlayerDataStatusIsMutedKeyPath] != nil) {
    NSNumber *isMuted = parameters[EXAVPlayerDataStatusIsMutedKeyPath];
    _isMuted = isMuted.boolValue;
  }
  if ([parameters objectForKey:EXAVPlayerDataStatusIsLoopingKeyPath] != nil) {
    NSNumber *isLooping = parameters[EXAVPlayerDataStatusIsLoopingKeyPath];
    [self _updateLooping:isLooping.boolValue];
  }
  
  if (_player && _isLoaded) {
    // Pause / mute first if necessary.
    if (![self _shouldPlayerPlay]) {
      [_player pause];
    }

    if (_isMuted || ![self _isPlayerPlaying]) {
      _player.muted = _isMuted;
    }

    // Apply idempotent parameters.
    if (_shouldCorrectPitch) {
      _player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmLowQualityZeroLatency;
    } else {
      _player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmVarispeed;
    }

    _player.volume = _volume.floatValue;
    
    
    // Apply parameters necessary after seek.
    __weak __typeof__(self) weakSelf = self;
    void (^applyPostSeekParameters)(BOOL) = ^(BOOL seekSucceeded) {
      __strong EXAVPlayerData *strongSelf = weakSelf;
      if (strongSelf) {
        strongSelf.currentPosition = strongSelf.player.currentTime;

        if (mustUpdateTimeObserver) {
          [strongSelf _updateTimeObserver];
        }

        NSError *audioSessionError = [strongSelf _tryPlayPlayerWithRateAndMuteIfNecessary];

        if (audioSessionError) {
          if (reject) {
            reject(@"E_AV_PLAY", @"Play encountered an error: audio session not activated.", audioSessionError);
          }
        } else if (!seekSucceeded) {
          if (reject) {
            reject(@"E_AV_SEEKING", nil, RCTErrorWithMessage(@"Seeking interrupted."));
          }
        } else if (resolve) {
          resolve([strongSelf getStatus]);
        }

        if (!resolve || !reject) {
          [strongSelf _callStatusUpdateCallback];
        }
      }

      [strongSelf.exAV demoteAudioSessionIfPossible];
    };
    
    // Apply seek if necessary.
    if (mustSeek) {
      [_player seekToTime:newPosition toleranceBefore:toleranceBefore toleranceAfter:toleranceAfter completionHandler:^(BOOL seekSucceeded) {
        dispatch_async(self->_exAV.methodQueue, ^{
          applyPostSeekParameters(seekSucceeded);
        });
      }];
    } else {
      applyPostSeekParameters(YES);
    }
  } else {
    _currentPosition = newPosition; // Will be set in the new _player on the call to [self _finishLoadingNewPlayer].
    if (resolve) {
      resolve([EXAVPlayerData getUnloadedStatus]);
    }
  }
}

#pragma mark - getStatus

- (BOOL)_isPlayerPlaying
{
  if ([_player respondsToSelector:@selector(timeControlStatus)]) {
    // Only available after iOS 10
    return [_player timeControlStatus] == AVPlayerTimeControlStatusPlaying;
  } else {
    // timeControlStatus is preferable to this when available
    // See http://stackoverflow.com/questions/5655864/check-play-state-of-avplayer
    return _player.rate != 0 && _player.error == nil;
  }
}

- (NSNumber *)_getRoundedMillisFromCMTime:(CMTime)time
{
  return CMTIME_IS_INVALID(time) || CMTIME_IS_INDEFINITE(time) ? nil : @((long) (CMTimeGetSeconds(time) * 1000));
}

- (NSNumber *)_getClippedValueForValue:(NSNumber *)value withMin:(NSNumber *)min withMax:(NSNumber *)max
{
  return (min != nil && [value doubleValue] < [min doubleValue]) ? min
       : (max != nil && [value doubleValue] > [max doubleValue]) ? max
       : value;
}

- (NSDictionary *)getStatus
{
  if (!_isLoaded || _player == nil) {
    return [EXAVPlayerData getUnloadedStatus];
  }
  
  AVPlayerItem *currentItem = _player.currentItem;
  if (_player.status != AVPlayerStatusReadyToPlay || currentItem.status != AVPlayerItemStatusReadyToPlay) {
    return [EXAVPlayerData getUnloadedStatus];
  }
  
  // Get duration and position:
  NSNumber *durationMillis = [self _getRoundedMillisFromCMTime:currentItem.duration];
  if (durationMillis) {
    durationMillis = [durationMillis doubleValue] < 0 ? 0 : durationMillis;
  }
  
  NSNumber *positionMillis = [self _getRoundedMillisFromCMTime:[_player currentTime]];
  positionMillis = [self _getClippedValueForValue:positionMillis withMin:@(0) withMax:durationMillis];
  
  // Calculate playable duration:
  NSNumber *playableDurationMillis;
  if (_player.status == AVPlayerStatusReadyToPlay) {
    __block CMTimeRange effectiveTimeRange;
    [currentItem.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
      CMTimeRange timeRange = [obj CMTimeRangeValue];
      if (CMTimeRangeContainsTime(timeRange, currentItem.currentTime)) {
        effectiveTimeRange = timeRange;
        *stop = YES;
      }
    }];
    playableDurationMillis = [self _getRoundedMillisFromCMTime:CMTimeRangeGetEnd(effectiveTimeRange)];
    if (playableDurationMillis) {
      playableDurationMillis = [self _getClippedValueForValue:playableDurationMillis withMin:@(0) withMax:durationMillis];
    }
  }
  
  // Calculate if the player is buffering
  BOOL isPlaying = [self _isPlayerPlaying];
  BOOL isBuffering;
  if (isPlaying) {
    isBuffering = NO;
  } else if ([_player respondsToSelector:@selector(timeControlStatus)]) {
    // Only available after iOS 10
    isBuffering = _player.timeControlStatus == AVPlayerTimeControlStatusWaitingToPlayAtSpecifiedRate;
  } else {
    isBuffering = !_player.currentItem.isPlaybackLikelyToKeepUp && _player.currentItem.isPlaybackBufferEmpty;
  }
  
  // TODO : react-native-video includes the iOS-only keys seekableDuration and canReverse (etc) flags.
  //        Consider adding these.
  NSMutableDictionary *mutableStatus = [@{EXAVPlayerDataStatusIsLoadedKeyPath: @(YES),
                                          
                                          EXAVPlayerDataStatusURIKeyPath: [_url absoluteString],
                                          
                                          EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath: _progressUpdateIntervalMillis,
                                          // positionMillis, playableDurationMillis, and durationMillis may be nil and are added after this definition.
                                          
                                          EXAVPlayerDataStatusShouldPlayKeyPath: @(_shouldPlay),
                                          EXAVPlayerDataStatusIsPlayingKeyPath: @(isPlaying),
                                          EXAVPlayerDataStatusIsBufferingKeyPath: @(isBuffering),
                                          
                                          EXAVPlayerDataStatusRateKeyPath: _rate,
                                          EXAVPlayerDataStatusShouldCorrectPitchKeyPath: @(_shouldCorrectPitch),
                                          EXAVPlayerDataStatusVolumeKeyPath: @(_player.volume),
                                          EXAVPlayerDataStatusIsMutedKeyPath: @(_player.muted),
                                          EXAVPlayerDataStatusIsLoopingKeyPath: @(_isLooping),
                                          
                                          EXAVPlayerDataStatusDidJustFinishKeyPath: @(NO),
                                          EXAVPlayerDataStatusHasJustBeenInterruptedKeyPath: @(NO),
                                          } mutableCopy];
  
  mutableStatus[EXAVPlayerDataStatusPlayableDurationMillisKeyPath] = playableDurationMillis;
  mutableStatus[EXAVPlayerDataStatusDurationMillisKeyPath] = durationMillis;
  mutableStatus[EXAVPlayerDataStatusPositionMillisKeyPath] = positionMillis;
  
  return mutableStatus;
}

- (void)_callStatusUpdateCallbackWithExtraFields:(NSDictionary *)extraFields
{
  NSDictionary *status;
  if (extraFields) {
    NSMutableDictionary *mutableStatus = [[self getStatus] mutableCopy];
    [mutableStatus addEntriesFromDictionary:extraFields];
    status = mutableStatus;
  } else {
    status = [self getStatus];
  }
  if (_statusUpdateCallback) {
    _statusUpdateCallback(status);
  }
}

- (void)_callStatusUpdateCallback
{
  [self _callStatusUpdateCallbackWithExtraFields:nil];
}

#pragma mark - Replay

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(RCTPromiseResolveBlock)resolve
                rejecter:(RCTPromiseRejectBlock)reject
{
  [self _callStatusUpdateCallbackWithExtraFields:@{
                                                   EXAVPlayerDataStatusHasJustBeenInterruptedKeyPath: @([self _isPlayerPlaying]),
                                                   }];
  // Player is in a prepared state and not playing, so we can just start to play with a regular `setStatus`.
  if (![self _isPlayerPlaying] && CMTimeCompare(_player.currentTime, kCMTimeZero) == 0) {
    [self setStatus:status resolver:resolve rejecter:reject];
  } else if ([_player.items count] > 1) {
    // There is an item ahead of the current item in the queue, so we can just advance to it (it should be seeked to 0)
    // and start to play with `setStatus`.
    [self _removeObserversForPlayerItem:_player.currentItem];
    [_player advanceToNextItem];
    [self setStatus:status resolver:resolve rejecter:reject];
  } else {
    // There is no item that we could advance to (replays happened to fast), so let's wait for the seeks to finish.
    // Then they will be added to the queue and the player will start to play, which we will know with KVO on `rate` or `timeControlStatus`.
    _replayResolve = resolve;
    if (status != nil) {
      [self setStatus:status resolver:nil rejecter:nil];
    }
  }
}

#pragma mark - Observers

- (void)_tryRemoveObserver:(NSObject *)object forKeyPath:(NSString *)path
{
  @try {
    [object removeObserver:self forKeyPath:path];
  } @catch (NSException *exception) {
    // no-op
  }
}

- (void)_removeObservers
{
  [self _tryRemoveObserver:_player forKeyPath:EXAVPlayerDataObserverStatusKeyPath];
  
  for (AVPlayerItem *item in _items) {
    [self _removeObserversForPlayerItem:item];
  }
  
  [self _tryRemoveObserver:_player forKeyPath:EXAVPlayerDataObserverRateKeyPath];
  [self _tryRemoveObserver:_player forKeyPath:EXAVPlayerDataObserverCurrentItemKeyPath];
  [self _tryRemoveObserver:_player forKeyPath:EXAVPlayerDataObserverTimeControlStatusPath];
}

- (void)_removeTimeObserver
{
  if (_timeObserver) {
    [_player removeTimeObserver:_timeObserver];
    _timeObserver = nil;
  }
}

- (void)_removeObserversForPlayerItem:(AVPlayerItem *)playerItem
{
  [self _tryRemoveObserver:playerItem forKeyPath:EXAVPlayerDataObserverStatusKeyPath];
  
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  if (_finishObserver) {
    [center removeObserver:_finishObserver];
    _finishObserver = nil;
  }
  if (_playbackStalledObserver) {
    [center removeObserver:_playbackStalledObserver];
    _playbackStalledObserver = nil;
  }
  
  [self _tryRemoveObserver:playerItem forKeyPath:EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath];
}

- (void)_addObserversForPlayerItem:(AVPlayerItem *)playerItem
{
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  __weak __typeof__(self) weakSelf = self;
  
  void (^didPlayToEndTimeObserverBlock)(NSNotification *note) = ^(NSNotification *note) {

    __strong EXAVPlayerData *strongSelf = weakSelf;
    __strong EXAV *strongEXAV = strongSelf ? strongSelf.exAV : nil;
    
    if (strongEXAV) {
      dispatch_async(strongEXAV.methodQueue, ^{
        __strong EXAVPlayerData *strongSelfInner = weakSelf;

        if (strongSelfInner) {
          [strongSelfInner _callStatusUpdateCallbackWithExtraFields:@{EXAVPlayerDataStatusDidJustFinishKeyPath: @(YES)}];
          // If the player is looping, we would only like to advance to next item (which is handled by actionAtItemEnd)
          if (!strongSelfInner.isLooping) {
            [strongSelfInner.player pause];
            strongSelfInner.shouldPlay = NO;
            __strong EXAV *strongEXAVInner = strongSelfInner.exAV;
            if (strongEXAVInner) {
              [strongEXAVInner demoteAudioSessionIfPossible];
            }
          }
        }
      });
    }
  };
  
  _finishObserver = [center addObserverForName:AVPlayerItemDidPlayToEndTimeNotification
                                        object:[_player currentItem]
                                         queue:nil
                                    usingBlock:didPlayToEndTimeObserverBlock];
  
  void (^playbackStalledObserverBlock)(NSNotification *note) = ^(NSNotification *note) {
    __strong EXAVPlayerData *strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf _callStatusUpdateCallback];
    }
  };
  
  _playbackStalledObserver = [center addObserverForName:AVPlayerItemPlaybackStalledNotification
                                                 object:[_player currentItem]
                                                  queue:nil
                                             usingBlock:playbackStalledObserverBlock];
  [self _tryRemoveObserver:playerItem forKeyPath:EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath];
  [playerItem addObserver:self forKeyPath:EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath options:0 context:nil];
  
  [self _tryRemoveObserver:playerItem forKeyPath:EXAVPlayerDataObserverStatusKeyPath];
  [playerItem addObserver:self forKeyPath:EXAVPlayerDataObserverStatusKeyPath options:0 context:nil];
}

- (void)_updateTimeObserver
{
  [self _removeTimeObserver];
  
  __weak __typeof__(self) weakSelf = self;
  
  CMTime interval = CMTimeMakeWithSeconds(_progressUpdateIntervalMillis.floatValue / 1000.0, NSEC_PER_SEC);
  
  void (^timeObserverBlock)(CMTime time) = ^(CMTime time) {
    __strong __typeof__(weakSelf) strongSelfOuter = weakSelf;
    __strong EXAV *strongEXAV = strongSelfOuter ? strongSelfOuter.exAV : nil;
    
    if (strongEXAV) {
      dispatch_async(strongEXAV.methodQueue, ^{
        __strong __typeof__(weakSelf) strongSelfInner = weakSelf;
        
        if (strongSelfInner && strongSelfInner.player.status == AVPlayerStatusReadyToPlay) {
          strongSelfInner.currentPosition = time; // We keep track of _currentPosition to reset the AVPlayer in handleMediaServicesReset.
          [strongSelfInner _callStatusUpdateCallback];
        }
      });
    }
  };
  
  _timeObserver = [_player addPeriodicTimeObserverForInterval:interval
                                                        queue:NULL
                                                   usingBlock:timeObserverBlock];
}

- (void)_addObserversForNewPlayer
{
  [self _removeObservers];
  [self _updateTimeObserver];

  [_player addObserver:self forKeyPath:EXAVPlayerDataObserverRateKeyPath options:0 context:nil];
  NSUInteger currentItemObservationOptions = NSKeyValueObservingOptionOld | NSKeyValueObservingOptionNew;
  [_player addObserver:self forKeyPath:EXAVPlayerDataObserverCurrentItemKeyPath options:currentItemObservationOptions context:nil];
  [_player addObserver:self forKeyPath:EXAVPlayerDataObserverTimeControlStatusPath options:0 context:nil]; // Only available after iOS 10
  [self _addObserversForPlayerItem:_player.currentItem];
}



- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if (_player == nil || (object != _player && ![_items containsObject:object])) {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    return;
  }
  
  __weak EXAVPlayerData *weakSelf = nil;

  // Specification of Objective-C always allows creation of weak references,
  // however on iOS trying to create a weak reference to a deallocated object
  // results in throwing an exception. If this happens we have nothing to do
  // as the EXAVPlayerData is being deallocated, so let's early return.
  //
  // See Stackoverflow question:
  // https://stackoverflow.com/questions/35991363/why-setting-object-that-is-undergoing-deallocation-to-weak-property-results-in-c#42329741
  @try {
     weakSelf = self;
  } @catch (NSException *exception) {
    return;
  }

  __strong EXAV *strongEXAV = _exAV;
  if (strongEXAV == nil) {
    return;
  }
  
  dispatch_async(strongEXAV.methodQueue, ^{
    __strong EXAVPlayerData *strongSelf = weakSelf;
    if (strongSelf) {
      if (object == strongSelf.player) {
        if ([keyPath isEqualToString:EXAVPlayerDataObserverStatusKeyPath]) {
          switch (strongSelf.player.status) {
            case AVPlayerStatusUnknown:
              break;
            case AVPlayerStatusReadyToPlay:
              if (!strongSelf.isLoaded && strongSelf.player.currentItem.status == AVPlayerItemStatusReadyToPlay) {
                [strongSelf _finishLoadingNewPlayer];
              }
              break;
            case AVPlayerStatusFailed: {
              strongSelf.isLoaded = NO;
              NSString *errorMessage = [NSString stringWithFormat:@"The AVPlayer instance has failed with the error code %li and domain \"%@\".", strongSelf.player.error.code, strongSelf.player.error.domain];
              if (strongSelf.player.error.localizedFailureReason) {
                NSString *reasonMessage = [strongSelf.player.error.localizedFailureReason stringByAppendingString:@" - "];
                errorMessage = [reasonMessage stringByAppendingString:errorMessage];
              }
              if (strongSelf.loadFinishBlock) {
                strongSelf.loadFinishBlock(NO, nil, errorMessage);
                strongSelf.loadFinishBlock = nil;
              } else if (strongSelf.errorCallback) {
                strongSelf.errorCallback(errorMessage);
              }
              break;
            }
          }
        } else if ([keyPath isEqualToString:EXAVPlayerDataObserverRateKeyPath]) {
          if (strongSelf.player.rate != 0) {
            strongSelf.rate = @(strongSelf.player.rate);
          }
          // If replayResolve is not nil here, it means that we had to pause playback due to empty queue of rewinded items.
          // This clause handles iOS 9.
          if (strongSelf.player.rate > 0 && strongSelf.replayResolve) {
            strongSelf.replayResolve([strongSelf getStatus]);
            strongSelf.replayResolve = nil;
          }

          int observedRate = strongSelf.observedRate.floatValue * 1000;
          int currentRate = strongSelf.player.rate * 1000;

          if (abs(observedRate - currentRate) > 1) {
            [strongSelf _callStatusUpdateCallback];
            strongSelf.observedRate = @(strongSelf.player.rate);
          }
        } else if ([keyPath isEqualToString:EXAVPlayerDataObserverTimeControlStatusPath]) {
          bool statusChanged = strongSelf.player.timeControlStatus != strongSelf.timeControlStatus;
          strongSelf.timeControlStatus = strongSelf.player.timeControlStatus;
          if (statusChanged) {
            [strongSelf _callStatusUpdateCallback];
          }
          // If replayResolve is not nil here, it means that we had to pause playback due to empty queue of rewinded items.
          // This clause handles iOS 10+.
          if (strongSelf.timeControlStatus == AVPlayerTimeControlStatusPlaying && strongSelf.replayResolve) {
            strongSelf.replayResolve([strongSelf getStatus]);
            strongSelf.replayResolve = nil;
          }
        } else if ([keyPath isEqualToString:EXAVPlayerDataObserverCurrentItemKeyPath]) {
          [strongSelf _addObserversForPlayerItem:change[NSKeyValueChangeNewKey]];
          // Treadmill pattern, see: https://developer.apple.com/videos/play/wwdc2016/503/
          AVPlayerItem *removedPlayerItem = change[NSKeyValueChangeOldKey];
          if (removedPlayerItem && removedPlayerItem != (id)[NSNull null]) {
            // Observers may have been removed in _finishObserver or replayWithStatus:resolver:rejecter

            // Item is already prepared, so let's just append it to the queue
            if (CMTimeCompare(removedPlayerItem.currentTime, kCMTimeZero) == 0) {
              [strongSelf.player insertItem:removedPlayerItem afterItem:nil];
            } else {
              // Prepare the item and then append it to the queue
              [removedPlayerItem seekToTime:kCMTimeZero completionHandler:^(BOOL finished) {
                dispatch_async(strongEXAV.methodQueue, ^{
                  __strong EXAVPlayerData *strongSelfInner = weakSelf;
                  if (strongSelfInner) {
                    [strongSelfInner.player insertItem:removedPlayerItem afterItem:nil];
                  }
                });
              }];
            }
          }
        }
      } else if (object == strongSelf.player.currentItem) {
        if ([keyPath isEqualToString:EXAVPlayerDataObserverStatusKeyPath]) {
          switch (strongSelf.player.currentItem.status) {
            case AVPlayerItemStatusUnknown:
              break;
            case AVPlayerItemStatusReadyToPlay:
              if (!strongSelf.isLoaded && strongSelf.player.status == AVPlayerItemStatusReadyToPlay) {
                [strongSelf _finishLoadingNewPlayer];
              }
              break;
            case AVPlayerItemStatusFailed: {
              NSString *errorMessage = [NSString stringWithFormat:@"The AVPlayerItem instance has failed with the error code %li and domain \"%@\".", strongSelf.player.currentItem.error.code, strongSelf.player.currentItem.error.domain];
              if (strongSelf.player.currentItem.error.localizedFailureReason) {
                NSString *reasonMessage = [strongSelf.player.currentItem.error.localizedFailureReason stringByAppendingString:@" - "];
                errorMessage = [reasonMessage stringByAppendingString:errorMessage];
              }
              if (strongSelf.loadFinishBlock) {
                strongSelf.loadFinishBlock(NO, nil, errorMessage);
                strongSelf.loadFinishBlock = nil;
              } else if (strongSelf.errorCallback) {
                strongSelf.errorCallback(errorMessage);
              }
              strongSelf.isLoaded = NO;
              break;
            }
          }
          [strongSelf _callStatusUpdateCallback];
        } else if ([keyPath isEqualToString:EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath]) {
          [strongSelf _callStatusUpdateCallback];
        }
      }
    }
  });
}

#pragma mark - EXAVObject

- (void)pauseImmediately
{
  if (_player) {
    [_player pause];
  }
}

- (EXAVAudioSessionMode)getAudioSessionModeRequired
{
  if (_player && ([self _isPlayerPlaying] || [self _shouldPlayerPlay])) {
    return _isMuted ? EXAVAudioSessionModeActiveMuted : EXAVAudioSessionModeActive;
  }
  return EXAVAudioSessionModeInactive;
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  [self _tryPlayPlayerWithRateAndMuteIfNecessary];
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  // EXAudio already forced pause.
}

- (void)handleAudioSessionInterruption:(NSNotification*)notification
{
  NSNumber *interruptionType = [[notification userInfo] objectForKey:AVAudioSessionInterruptionTypeKey];
  switch (interruptionType.unsignedIntegerValue) {
    case AVAudioSessionInterruptionTypeBegan:
      // System already forced pause.
      [self _callStatusUpdateCallback];
      break;
    case AVAudioSessionInterruptionTypeEnded:
      [self _tryPlayPlayerWithRateAndMuteIfNecessary];
      [self _callStatusUpdateCallback];
      break;
    default:
      break;
  }
}

- (void)handleMediaServicesReset:(void (^)(void))finishCallback
{
  // See here: https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
  
  _isLoaded = NO;
  
  // We want to temporarily disable _statusUpdateCallback so that all of the new state changes don't trigger a waterfall of updates:
  void (^callback)(NSDictionary *) = _statusUpdateCallback;
  _statusUpdateCallback = nil;
  __weak __typeof__(self) weakSelf = self;
  
  _loadFinishBlock = ^(BOOL success, NSDictionary *successStatus, NSString *error) {
    __weak EXAVPlayerData *strongSelf = weakSelf;
    if (strongSelf) {
      if (finishCallback != nil) {
        finishCallback();
      }
      if (strongSelf.statusUpdateCallback == nil) {
        strongSelf.statusUpdateCallback = callback;
      }
      [strongSelf _callStatusUpdateCallback];
      if (!success && strongSelf.errorCallback) {
        strongSelf.errorCallback(error);
      }
    }
  };
  
  [self _removeTimeObserver];
  [self _removeObservers];
  
  [self _loadNewPlayer];
}

#pragma mark - NSObject Lifecycle

- (void)dealloc
{
  [self _removeTimeObserver];
  [self _removeObservers];
}

# pragma mark - Utilities

/*
 * For a given NSDictionary returns a new NSDictionary with
 * entries only of type (String, String).
 */
- (NSDictionary *)validatedRequestHeaders:(NSDictionary *)requestHeaders
{
  NSMutableDictionary *validatedHeaders = [NSMutableDictionary new];
  for (id key in requestHeaders.allKeys) {
    id value = requestHeaders[key];
    if ([key isKindOfClass:[NSString class]] && [value isKindOfClass:[NSString class]]) {
      validatedHeaders[key] = value;
    }
  }
  return validatedHeaders;
}

@end
