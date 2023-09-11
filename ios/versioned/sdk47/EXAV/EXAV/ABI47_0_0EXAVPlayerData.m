// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXAV/ABI47_0_0EXAVPlayerData.h>

// This struct is passed between the MTAudioProcessingTap callbacks.
typedef struct AVAudioTapProcessorContext {
  Boolean supportedTapProcessingFormat;
  Boolean isNonInterleaved;
  void *self; // a pointer to ABI47_0_0EXAVPlayerData
} AVAudioTapProcessorContext;

NSString *const ABI47_0_0EXAVPlayerDataStatusIsLoadedKeyPath = @"isLoaded";
NSString *const ABI47_0_0EXAVPlayerDataStatusURIKeyPath = @"uri";
NSString *const ABI47_0_0EXAVPlayerDataStatusHeadersKeyPath = @"headers";
NSString *const ABI47_0_0EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath = @"progressUpdateIntervalMillis";
NSString *const ABI47_0_0EXAVPlayerDataStatusDurationMillisKeyPath = @"durationMillis";
NSString *const ABI47_0_0EXAVPlayerDataStatusPositionMillisKeyPath = @"positionMillis";
NSString *const ABI47_0_0EXAVPlayerDataStatusSeekMillisToleranceBeforeKeyPath = @"seekMillisToleranceBefore";
NSString *const ABI47_0_0EXAVPlayerDataStatusSeekMillisToleranceAfterKeyPath = @"seekMillisToleranceAfter";
NSString *const ABI47_0_0EXAVPlayerDataStatusPlayableDurationMillisKeyPath = @"playableDurationMillis";
NSString *const ABI47_0_0EXAVPlayerDataStatusShouldPlayKeyPath = @"shouldPlay";
NSString *const ABI47_0_0EXAVPlayerDataStatusIsPlayingKeyPath = @"isPlaying";
NSString *const ABI47_0_0EXAVPlayerDataStatusIsBufferingKeyPath = @"isBuffering";
NSString *const ABI47_0_0EXAVPlayerDataStatusRateKeyPath = @"rate";
NSString *const ABI47_0_0EXAVPlayerDataStatusPitchCorrectionQualityKeyPath = @"pitchCorrectionQuality";
NSString *const ABI47_0_0EXAVPlayerDataStatusShouldCorrectPitchKeyPath = @"shouldCorrectPitch";
NSString *const ABI47_0_0EXAVPlayerDataStatusVolumeKeyPath = @"volume";
NSString *const ABI47_0_0EXAVPlayerDataStatusIsMutedKeyPath = @"isMuted";
NSString *const ABI47_0_0EXAVPlayerDataStatusIsLoopingKeyPath = @"isLooping";
NSString *const ABI47_0_0EXAVPlayerDataStatusDidJustFinishKeyPath = @"didJustFinish";
NSString *const ABI47_0_0EXAVPlayerDataStatusHasJustBeenInterruptedKeyPath = @"hasJustBeenInterrupted";

NSString *const ABI47_0_0EXAVPlayerDataObserverStatusKeyPath = @"status";
NSString *const ABI47_0_0EXAVPlayerDataObserverRateKeyPath = @"rate";
NSString *const ABI47_0_0EXAVPlayerDataObserverCurrentItemKeyPath = @"currentItem";
NSString *const ABI47_0_0EXAVPlayerDataObserverTimeControlStatusPath = @"timeControlStatus";
NSString *const ABI47_0_0EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath = @"playbackBufferEmpty";
NSString *const ABI47_0_0EXAVPlayerDataObserverMetadataKeyPath = @"timedMetadata";

@interface ABI47_0_0EXAVPlayerData ()

@property (nonatomic, weak) ABI47_0_0EXAV *exAV;

@property (nonatomic, assign) BOOL isLoaded;
@property (nonatomic, strong) void (^loadFinishBlock)(BOOL success, NSDictionary *successStatus, NSString *error);

@property (nonatomic, strong) id <NSObject> timeObserver;
@property (nonatomic, strong) id <NSObject> finishObserver;
@property (nonatomic, strong) id <NSObject> playbackStalledObserver;
@property (nonatomic, strong) NSMapTable<NSObject *, NSMutableSet<NSString *> *> *observers;

@property (nonatomic, strong) NSNumber *progressUpdateIntervalMillis;
@property (nonatomic, assign) CMTime currentPosition;
@property (nonatomic, assign) BOOL shouldPlay;
@property (nonatomic, strong) NSNumber *rate;
@property (nonatomic, strong) NSString *pitchCorrectionQuality;
@property (nonatomic, strong) NSNumber *observedRate;
@property (nonatomic, assign) AVPlayerTimeControlStatus timeControlStatus;
@property (nonatomic, assign) BOOL shouldCorrectPitch;
@property (nonatomic, strong) NSNumber* volume;
@property (nonatomic, assign) BOOL isMuted;
@property (nonatomic, assign) BOOL isLooping;
@property (nonatomic, strong) NSArray<AVPlayerItem *> *items;

@property (nonatomic, strong) ABI47_0_0EXPromiseResolveBlock replayResolve;

@end

@implementation ABI47_0_0EXAVPlayerData
{
  ABI47_0_0EXAudioSampleCallback* _audioSampleBufferCallback;
}

#pragma mark - Static methods

+ (NSDictionary *)getUnloadedStatus
{
  return @{ABI47_0_0EXAVPlayerDataStatusIsLoadedKeyPath: @(NO)};
}

#pragma mark - Init and player loading

- (instancetype)initWithEXAV:(ABI47_0_0EXAV *)exAV
                  withSource:(NSDictionary *)source
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock
{
  if ((self = [super init])) {
    _exAV = exAV;
  
    _isLoaded = NO;
    _loadFinishBlock = loadFinishBlock;
  
    _player = nil;
  
    _url = [NSURL URLWithString:[source objectForKey:ABI47_0_0EXAVPlayerDataStatusURIKeyPath]];
    _headers = [self validatedRequestHeaders:source[ABI47_0_0EXAVPlayerDataStatusHeadersKeyPath]];
  
    _timeObserver = nil;
    _finishObserver = nil;
    _playbackStalledObserver = nil;
    _statusUpdateCallback = nil;
    _observers = [NSMapTable new];
  
    // These status props will be potentially reset by the following call to [self setStatus:parameters ...].
    _progressUpdateIntervalMillis = @(500);
    _currentPosition = kCMTimeZero;
    _timeControlStatus = 0;
    _shouldPlay = NO;
    _rate = @(1.0);
    _pitchCorrectionQuality = AVAudioTimePitchAlgorithmVarispeed;
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
  ABI47_0_0EX_WEAKIFY(self);
  [avAsset loadValuesAsynchronouslyForKeys:@[ @"duration" ] completionHandler:^{
    ABI47_0_0EX_ENSURE_STRONGIFY(self);

    // We prepare three items for AVQueuePlayer, so when the first finishes playing,
    // second can start playing and the third can start preparing to play.
    AVPlayerItem *firstplayerItem = [AVPlayerItem playerItemWithAsset:avAsset];
    AVPlayerItem *secondPlayerItem = [AVPlayerItem playerItemWithAsset:avAsset];
    AVPlayerItem *thirdPlayerItem = [AVPlayerItem playerItemWithAsset:avAsset];
    self.items = @[firstplayerItem, secondPlayerItem, thirdPlayerItem];
    self.player = [AVQueuePlayer queuePlayerWithItems:@[firstplayerItem, secondPlayerItem, thirdPlayerItem]];
    if (self.player) {
      [self _addObserver:self.player forKeyPath:ABI47_0_0EXAVPlayerDataObserverStatusKeyPath];
      [self _addObserver:self.player.currentItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverStatusKeyPath];
      [self _addObserver:self.player.currentItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverMetadataKeyPath];
    } else {
      NSString *errorMessage = @"Load encountered an error: [AVPlayer playerWithPlayerItem:] returned nil.";
      if (self.loadFinishBlock) {
        self.loadFinishBlock(NO, nil, errorMessage);
        self.loadFinishBlock = nil;
      } else if (self.errorCallback) {
        self.errorCallback(errorMessage);
      }
    }
  }];
}

- (void)_finishLoadingNewPlayer
{
  // Set up player with parameters
  ABI47_0_0EX_WEAKIFY(self);
  [_player seekToTime:_currentPosition completionHandler:^(BOOL finished) {
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    __strong ABI47_0_0EXAV *strongEXAV = self.exAV;
    if (strongEXAV) {
      dispatch_async(self.exAV.methodQueue, ^{
        ABI47_0_0EX_ENSURE_STRONGIFY(self);
        self.currentPosition = self.player.currentTime;

        self.player.currentItem.audioTimePitchAlgorithm = self.pitchCorrectionQuality;
        self.player.volume = self.volume.floatValue;
        self.player.muted = self.isMuted;
        [self _updateLooping:self.isLooping];

        [self _tryPlayPlayerWithRateAndMuteIfNecessary];

        self.isLoaded = YES;

        [self _addObserversForNewPlayer];

        if (self.loadFinishBlock) {
          self.loadFinishBlock(YES, [self getStatus], nil);
          self.loadFinishBlock = nil;
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
         resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  BOOL mustUpdateTimeObserver = NO;
  BOOL mustSeek = NO;
  
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath] != nil) {
    NSNumber *progressUpdateIntervalMillis = parameters[ABI47_0_0EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath];
    mustUpdateTimeObserver = ![progressUpdateIntervalMillis isEqualToNumber:_progressUpdateIntervalMillis];
    _progressUpdateIntervalMillis = progressUpdateIntervalMillis;
  }
  
  // To prevent a race condition, we set _currentPosition at the end of this method.
  CMTime newPosition = _currentPosition;
  
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusPositionMillisKeyPath] != nil) {
    NSNumber *currentPositionMillis = parameters[ABI47_0_0EXAVPlayerDataStatusPositionMillisKeyPath];
    
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
  if (mustSeek && [parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusSeekMillisToleranceBeforeKeyPath] != nil) {
    NSNumber *seekMillisToleranceBefore = parameters[ABI47_0_0EXAVPlayerDataStatusSeekMillisToleranceBeforeKeyPath];
    toleranceBefore = CMTimeMakeWithSeconds(seekMillisToleranceBefore.floatValue / 1000, NSEC_PER_SEC);
  }
  
  // We need to set toleranceAfter only if we will seek
  if (mustSeek && [parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusSeekMillisToleranceAfterKeyPath] != nil) {
    NSNumber *seekMillisToleranceAfter = parameters[ABI47_0_0EXAVPlayerDataStatusSeekMillisToleranceAfterKeyPath];
    toleranceAfter = CMTimeMakeWithSeconds(seekMillisToleranceAfter.floatValue / 1000, NSEC_PER_SEC);
  }
  
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusShouldPlayKeyPath] != nil) {
    NSNumber *shouldPlay = parameters[ABI47_0_0EXAVPlayerDataStatusShouldPlayKeyPath];
    _shouldPlay = shouldPlay.boolValue;
  }
  
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusRateKeyPath] != nil) {
    NSNumber *rate = parameters[ABI47_0_0EXAVPlayerDataStatusRateKeyPath];
    _rate = rate;
  }
  
  if (parameters[ABI47_0_0EXAVPlayerDataStatusPitchCorrectionQualityKeyPath] != nil) {
    _pitchCorrectionQuality = parameters[ABI47_0_0EXAVPlayerDataStatusPitchCorrectionQualityKeyPath];
  }
  
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusShouldCorrectPitchKeyPath] != nil) {
    NSNumber *shouldCorrectPitch = parameters[ABI47_0_0EXAVPlayerDataStatusShouldCorrectPitchKeyPath];
    _shouldCorrectPitch = shouldCorrectPitch.boolValue;
  }
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusVolumeKeyPath] != nil) {
    NSNumber *volume = parameters[ABI47_0_0EXAVPlayerDataStatusVolumeKeyPath];
    _volume = volume;
  }
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusIsMutedKeyPath] != nil) {
    NSNumber *isMuted = parameters[ABI47_0_0EXAVPlayerDataStatusIsMutedKeyPath];
    _isMuted = isMuted.boolValue;
  }
  if ([parameters objectForKey:ABI47_0_0EXAVPlayerDataStatusIsLoopingKeyPath] != nil) {
    NSNumber *isLooping = parameters[ABI47_0_0EXAVPlayerDataStatusIsLoopingKeyPath];
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
      _player.currentItem.audioTimePitchAlgorithm = _pitchCorrectionQuality;
    } else {
      _player.currentItem.audioTimePitchAlgorithm = AVAudioTimePitchAlgorithmVarispeed;
    }

    _player.volume = _volume.floatValue;
    
    // Apply parameters necessary after seek.
    ABI47_0_0EX_WEAKIFY(self);
    void (^applyPostSeekParameters)(BOOL) = ^(BOOL seekSucceeded) {
      ABI47_0_0EX_ENSURE_STRONGIFY(self);
      self.currentPosition = self.player.currentTime;

      if (mustUpdateTimeObserver) {
        [self _updateTimeObserver];
      }

      NSError *audioSessionError = [self _tryPlayPlayerWithRateAndMuteIfNecessary];

      if (audioSessionError) {
        if (reject) {
          reject(@"E_AV_PLAY", @"Play encountered an error: audio session not activated.", audioSessionError);
        }
      } else if (!seekSucceeded) {
        if (reject) {
          reject(@"E_AV_SEEKING", nil, ABI47_0_0EXErrorWithMessage(@"Seeking interrupted."));
        }
      } else if (resolve) {
        resolve([self getStatus]);
      }

      if (!resolve || !reject) {
        [self _callStatusUpdateCallback];
      }

      [self.exAV demoteAudioSessionIfPossible];
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
      resolve([ABI47_0_0EXAVPlayerData getUnloadedStatus]);
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

- (double)getCurrentPositionPrecise
{
  NSNumber *durationMillis = [self _getRoundedMillisFromCMTime:_player.currentItem.duration];
  if (durationMillis) {
    durationMillis = @(MAX(durationMillis.longValue, 0));
  }

  NSNumber *positionMillis = [self _getRoundedMillisFromCMTime:[_player currentTime]];
  positionMillis = [self _getClippedValueForValue:positionMillis withMin:@(0) withMax:durationMillis];
  return positionMillis.doubleValue / 1000.0;
}

- (NSDictionary *)getStatus
{
  if (!_isLoaded || _player == nil) {
    return [ABI47_0_0EXAVPlayerData getUnloadedStatus];
  }
  
  AVPlayerItem *currentItem = _player.currentItem;
  if (_player.status != AVPlayerStatusReadyToPlay || currentItem.status != AVPlayerItemStatusReadyToPlay) {
    return [ABI47_0_0EXAVPlayerData getUnloadedStatus];
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
  NSMutableDictionary *mutableStatus = [@{ABI47_0_0EXAVPlayerDataStatusIsLoadedKeyPath: @(YES),
                                          
                                          ABI47_0_0EXAVPlayerDataStatusURIKeyPath: [_url absoluteString],
                                          
                                          ABI47_0_0EXAVPlayerDataStatusProgressUpdateIntervalMillisKeyPath: _progressUpdateIntervalMillis,
                                          // positionMillis, playableDurationMillis, and durationMillis may be nil and are added after this definition.
                                          
                                          ABI47_0_0EXAVPlayerDataStatusShouldPlayKeyPath: @(_shouldPlay),
                                          ABI47_0_0EXAVPlayerDataStatusIsPlayingKeyPath: @(isPlaying),
                                          ABI47_0_0EXAVPlayerDataStatusIsBufferingKeyPath: @(isBuffering),
                                          
                                          ABI47_0_0EXAVPlayerDataStatusRateKeyPath: _rate,
                                          ABI47_0_0EXAVPlayerDataStatusShouldCorrectPitchKeyPath: @(_shouldCorrectPitch),
                                          ABI47_0_0EXAVPlayerDataStatusPitchCorrectionQualityKeyPath: _pitchCorrectionQuality,
                                          ABI47_0_0EXAVPlayerDataStatusVolumeKeyPath: @(_player.volume),
                                          ABI47_0_0EXAVPlayerDataStatusIsMutedKeyPath: @(_player.muted),
                                          ABI47_0_0EXAVPlayerDataStatusIsLoopingKeyPath: @(_isLooping),
                                          
                                          ABI47_0_0EXAVPlayerDataStatusDidJustFinishKeyPath: @(NO),
                                          ABI47_0_0EXAVPlayerDataStatusHasJustBeenInterruptedKeyPath: @(NO),
                                          } mutableCopy];
  
  mutableStatus[ABI47_0_0EXAVPlayerDataStatusPlayableDurationMillisKeyPath] = playableDurationMillis;
  mutableStatus[ABI47_0_0EXAVPlayerDataStatusDurationMillisKeyPath] = durationMillis;
  mutableStatus[ABI47_0_0EXAVPlayerDataStatusPositionMillisKeyPath] = positionMillis;
  
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
                resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  [self _callStatusUpdateCallbackWithExtraFields:@{
                                                   ABI47_0_0EXAVPlayerDataStatusHasJustBeenInterruptedKeyPath: @([self _isPlayerPlaying]),
                                                   }];
  // Player is in a prepared state and not playing, so we can just start to play with a regular `setStatus`.
  if (![self _isPlayerPlaying] && CMTimeCompare(_player.currentTime, kCMTimeZero) == 0) {
    [self setStatus:status resolver:resolve rejecter:reject];
  } else if ([_player.items count] > 1) {
    // There is an item ahead of the current item in the queue, so we can just advance to it (it should be seeked to 0)
    // and start to play with `setStatus`.
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

- (void)_addObserver:(NSObject *)object forKeyPath:(NSString *)path
{
  [self _addObserver:object forKeyPath:path options:0];
}

- (void)_addObserver:(NSObject *)object forKeyPath:(NSString *)path options:(NSKeyValueObservingOptions)options
{
  NSMutableSet<NSString *> *set = [_observers objectForKey:object];
  if (set == nil) {
    set = [NSMutableSet set];
    [_observers setObject:set forKey:object];
  }
  if (![set containsObject:path]) {
    [set addObject:path];
    [object addObserver:self forKeyPath:path options:options context:nil];
  }
}

- (void)_tryRemoveObserver:(NSObject *)object forKeyPath:(NSString *)path
{
  NSMutableSet<NSString *> *set = [_observers objectForKey:object];
  if (set) {
    if ([set containsObject:path]) {
      [set removeObject:path];
      if (!set.count) {
        [_observers removeObjectForKey:object];
      }
      [object removeObserver:self forKeyPath:path];
    }
  }
}

- (void)_removeObservers
{
  [self _tryRemoveObserver:_player forKeyPath:ABI47_0_0EXAVPlayerDataObserverStatusKeyPath];
  [self _removeObserversForPlayerItems];
  [self _tryRemoveObserver:_player forKeyPath:ABI47_0_0EXAVPlayerDataObserverRateKeyPath];
  [self _tryRemoveObserver:_player forKeyPath:ABI47_0_0EXAVPlayerDataObserverCurrentItemKeyPath];
  [self _tryRemoveObserver:_player forKeyPath:ABI47_0_0EXAVPlayerDataObserverTimeControlStatusPath];
}

- (void)_removeTimeObserver
{
  if (_timeObserver) {
    [_player removeTimeObserver:_timeObserver];
    _timeObserver = nil;
  }
}

- (void)_removeObserversForPlayerItems
{
  for (AVPlayerItem *item in _items) {
    [self _removeObserversForPlayerItem:item];
  }
}

- (void)_removeObserversForPlayerItem:(AVPlayerItem *)playerItem
{
  [self _tryRemoveObserver:playerItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverStatusKeyPath];
  
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  if (_finishObserver) {
    [center removeObserver:_finishObserver];
    _finishObserver = nil;
  }
  if (_playbackStalledObserver) {
    [center removeObserver:_playbackStalledObserver];
    _playbackStalledObserver = nil;
  }
  
  [self _tryRemoveObserver:playerItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath];
  [self _tryRemoveObserver:playerItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverMetadataKeyPath];
}

- (void)_addObserversForPlayerItem:(AVPlayerItem *)playerItem
{
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  ABI47_0_0EX_WEAKIFY(self);
  
  void (^didPlayToEndTimeObserverBlock)(NSNotification *note) = ^(NSNotification *note) {
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    __strong ABI47_0_0EXAV *strongEXAV = self.exAV;
    if (strongEXAV) {
      dispatch_async(strongEXAV.methodQueue, ^{
        ABI47_0_0EX_ENSURE_STRONGIFY(self);
        [self _callStatusUpdateCallbackWithExtraFields:@{ABI47_0_0EXAVPlayerDataStatusDidJustFinishKeyPath: @(YES)}];
        // If the player is looping, we would only like to advance to next item (which is handled by actionAtItemEnd)
        if (!self.isLooping) {
          [self.player pause];
          self.shouldPlay = NO;
          __strong ABI47_0_0EXAV *strongEXAVInner = self.exAV;
          if (strongEXAVInner) {
            [strongEXAVInner demoteAudioSessionIfPossible];
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
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    [self _callStatusUpdateCallback];
  };
  
  _playbackStalledObserver = [center addObserverForName:AVPlayerItemPlaybackStalledNotification
                                                 object:[_player currentItem]
                                                  queue:nil
                                             usingBlock:playbackStalledObserverBlock];
  [self _addObserver:playerItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath];
  [self _addObserver:playerItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverStatusKeyPath];
  [self _addObserver:playerItem forKeyPath:ABI47_0_0EXAVPlayerDataObserverMetadataKeyPath];
}

- (void)_updateTimeObserver
{
  [self _removeTimeObserver];
  
  ABI47_0_0EX_WEAKIFY(self);
  
  CMTime interval = CMTimeMakeWithSeconds(_progressUpdateIntervalMillis.floatValue / 1000.0, NSEC_PER_SEC);
  
  void (^timeObserverBlock)(CMTime time) = ^(CMTime time) {
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    __strong ABI47_0_0EXAV *strongEXAV = self.exAV;
    if (strongEXAV) {
      dispatch_async(strongEXAV.methodQueue, ^{
        ABI47_0_0EX_ENSURE_STRONGIFY(self);
        
        if (self && self.player.status == AVPlayerStatusReadyToPlay) {
          self.currentPosition = time; // We keep track of _currentPosition to reset the AVPlayer in handleMediaServicesReset.
          [self _callStatusUpdateCallback];
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

  [self _addObserver:_player forKeyPath:ABI47_0_0EXAVPlayerDataObserverRateKeyPath];
  NSUInteger currentItemObservationOptions = NSKeyValueObservingOptionOld | NSKeyValueObservingOptionNew;
  [self _addObserver:_player forKeyPath:ABI47_0_0EXAVPlayerDataObserverCurrentItemKeyPath options:currentItemObservationOptions];
  [self _addObserver:_player forKeyPath:ABI47_0_0EXAVPlayerDataObserverTimeControlStatusPath]; // Only available after iOS 10
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
  
  __weak ABI47_0_0EXAVPlayerData *weakSelf = nil;

  // Specification of Objective-C always allows creation of weak references,
  // however on iOS trying to create a weak reference to a deallocated object
  // results in throwing an exception. If this happens we have nothing to do
  // as the ABI47_0_0EXAVPlayerData is being deallocated, so let's early return.
  //
  // See Stackoverflow question:
  // https://stackoverflow.com/questions/35991363/why-setting-object-that-is-undergoing-deallocation-to-weak-property-results-in-c#42329741
  @try {
     weakSelf = self;
  } @catch (NSException *exception) {
    return;
  }

  __strong ABI47_0_0EXAV *strongEXAV = _exAV;
  if (strongEXAV == nil) {
    return;
  }
  
  dispatch_async(strongEXAV.methodQueue, ^{
    __strong ABI47_0_0EXAVPlayerData *strongSelf = weakSelf;
    if (strongSelf) {
      if (object == strongSelf.player) {
        if ([keyPath isEqualToString:ABI47_0_0EXAVPlayerDataObserverStatusKeyPath]) {
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
              NSString *errorMessage = [NSString stringWithFormat:@"The AVPlayer instance has failed with the error code %li and domain \"%@\".", (long) strongSelf.player.error.code, strongSelf.player.error.domain];
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
        } else if ([keyPath isEqualToString:ABI47_0_0EXAVPlayerDataObserverRateKeyPath]) {
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
        } else if ([keyPath isEqualToString:ABI47_0_0EXAVPlayerDataObserverTimeControlStatusPath]) {
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
        } else if ([keyPath isEqualToString:ABI47_0_0EXAVPlayerDataObserverCurrentItemKeyPath]) {
          [strongSelf _removeObserversForPlayerItems];
          [strongSelf _addObserversForPlayerItem:change[NSKeyValueChangeNewKey]];
          // Treadmill pattern, see: https://developer.apple.com/videos/play/wwdc2016/503/
          AVPlayerItem *removedPlayerItem = change[NSKeyValueChangeOldKey];
          if (removedPlayerItem && removedPlayerItem != (id)[NSNull null]) {
            // Observers may have been removed in _finishObserver or replayWithStatus:resolver:rejecter

            // Rewind player item and re-add to queue
            if (CMTimeCompare(removedPlayerItem.currentTime, kCMTimeZero) != 0) {
              // In some cases (when using HSLS/m3u8 files), the completionHandler
              // was not called after the stream had completed fully.
              // This appears to be a bug in iOS.
              // Therefore, do not wait for the seek to complete, but merely
              // initiate the seek and expect it to have completed when it's
              // this AVPlayerItem's turn to play.
              [removedPlayerItem seekToTime:kCMTimeZero completionHandler:nil];
            }
            [strongSelf.player insertItem:removedPlayerItem afterItem:nil];
          }
          
          if (self.sampleBufferCallback != nil) {
            // Tap is installed per item, so we re-install for the new item.
            [self installTap];
          }
        }
      } else if (object == strongSelf.player.currentItem) {
        if ([keyPath isEqualToString:ABI47_0_0EXAVPlayerDataObserverStatusKeyPath]) {
          switch (strongSelf.player.currentItem.status) {
            case AVPlayerItemStatusUnknown:
              break;
            case AVPlayerItemStatusReadyToPlay:
              if (!strongSelf.isLoaded && strongSelf.player.status == AVPlayerItemStatusReadyToPlay) {
                [strongSelf _finishLoadingNewPlayer];
              }
              break;
            case AVPlayerItemStatusFailed: {
              NSString *errorMessage = [NSString stringWithFormat:@"The AVPlayerItem instance has failed with the error code %li and domain \"%@\".", (long) strongSelf.player.currentItem.error.code, strongSelf.player.currentItem.error.domain];
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
        } else if ([keyPath isEqualToString:ABI47_0_0EXAVPlayerDataObserverPlaybackBufferEmptyKeyPath]) {
          [strongSelf _callStatusUpdateCallback];
        } else if ([keyPath isEqualToString:ABI47_0_0EXAVPlayerDataObserverMetadataKeyPath] && strongSelf.metadataUpdateCallback) {
          NSArray<AVMetadataItem *> *timedMetadata = strongSelf.player.currentItem.timedMetadata;
          NSMutableDictionary *metadata = [@{} mutableCopy];
          for (AVMetadataItem *item in timedMetadata) {
            if ([item.commonKey isEqual:AVMetadataCommonKeyTitle]) {
              NSString *title = item.stringValue;
              [metadata setObject:title forKey:@"title"];
              break;
            }
          }
          strongSelf.metadataUpdateCallback(metadata);
        }
      }
    }
  });
}

#pragma mark - Sample Buffer Callbacks & AudioMix Tap

- (void)setSampleBufferCallback:(ABI47_0_0EXAudioSampleCallback *)sampleBufferCallback
{
  if (sampleBufferCallback) {
    [self installTap];
  } else {
    [self uninstallTap];
  }
  
  _audioSampleBufferCallback = sampleBufferCallback;
}

- (ABI47_0_0EXAudioSampleCallback *)sampleBufferCallback
{
  return _audioSampleBufferCallback;
}

- (void)installTap
{
  AVPlayerItem *item = [_player currentItem];
  // TODO: What if a player item has multiple tracks?
  AVAssetTrack *track = item.tracks.firstObject.assetTrack;
  if (!track)
  {
    ABI47_0_0EXLogError(@"Failed to find a track in the current player item!");
    return;
  }

  AVMutableAudioMix *audioMix = [AVMutableAudioMix audioMix];
  if (audioMix) {
    AVMutableAudioMixInputParameters *audioMixInputParameters = [AVMutableAudioMixInputParameters audioMixInputParametersWithTrack:track];
    if (audioMixInputParameters) {
      MTAudioProcessingTapCallbacks callbacks;

      callbacks.version = kMTAudioProcessingTapCallbacksVersion_0;
      callbacks.clientInfo = (__bridge void *)self;
      callbacks.init = ABI47_0_0EXTapInit;
      callbacks.finalize = ABI47_0_0EXTapFinalize;
      callbacks.prepare = ABI47_0_0EXTapPrepare;
      callbacks.unprepare = ABI47_0_0EXTapUnprepare;
      callbacks.process = ABI47_0_0EXTapProcess;

      MTAudioProcessingTapRef audioProcessingTap;
      OSStatus status = MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PreEffects, &audioProcessingTap);
      if (status == noErr) {
        audioMixInputParameters.audioTapProcessor = audioProcessingTap;
        audioMix.inputParameters = @[audioMixInputParameters];

        [item setAudioMix:audioMix];

        CFRelease(audioProcessingTap);
      } else {
        ABI47_0_0EXLogError(@"Failed to create MTAudioProcessingTap!");
      }
    }
  }
}

- (void)uninstallTap
{
  AVPlayerItem *item = [_player currentItem];
  [item setAudioMix:nil];
}

#pragma mark - Audio Sample Buffer Callbacks (MTAudioProcessingTapCallbacks)

void ABI47_0_0EXTapInit(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut)
{
  AVAudioTapProcessorContext *context = calloc(1, sizeof(AVAudioTapProcessorContext));

  // Initialize MTAudioProcessingTap context.
  context->isNonInterleaved = false;
  context->self = clientInfo;

  *tapStorageOut = context;
}

void ABI47_0_0EXTapFinalize(MTAudioProcessingTapRef tap)
{
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);

  // Clear MTAudioProcessingTap context.
  context->self = NULL;

  free(context);
}

void ABI47_0_0EXTapPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat)
{
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);

  context->supportedTapProcessingFormat = true;

  if (processingFormat->mFormatID != kAudioFormatLinearPCM) {
    ABI47_0_0EXLogInfo(@"Audio Format ID for audioProcessingTap: LinearPCM");
    // TODO(barthap): Does LinearPCM work with the audio sample buffer callback?
  }
  if (!(processingFormat->mFormatFlags & kAudioFormatFlagIsFloat)) {
    ABI47_0_0EXLogInfo(@"Audio Format ID for audioProcessingTap: Float only");
    // TODO(barthap): Does Float work with the audio sample buffer callback?
  }

  if (processingFormat->mFormatFlags & kAudioFormatFlagIsNonInterleaved) {
    context->isNonInterleaved = true;
  }
}

void ABI47_0_0EXTapUnprepare(MTAudioProcessingTapRef tap)
{
  AVAudioTapProcessorContext *context =
    (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  context->self = NULL;
}

void ABI47_0_0EXTapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut)
{
  AVAudioTapProcessorContext *context =
    (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);

  if (!context->self) {
    ABI47_0_0EXLogWarn(@"Audio Processing Tap has been destroyed!");
    return;
  }

  ABI47_0_0EXAVPlayerData *_self = ((__bridge ABI47_0_0EXAVPlayerData *)context->self);

  if (!_self.sampleBufferCallback) {
    return;
  }

  // Get actual audio buffers from MTAudioProcessingTap
  OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
  if (noErr != status) {
    ABI47_0_0EXLogWarn(@"MTAudioProcessingTapGetSourceAudio: %d", (int)status);
    return;
  }

  double seconds = [_self getCurrentPositionPrecise];
  [_self.sampleBufferCallback callWithAudioBuffer:&bufferListInOut->mBuffers[0] andTimestamp:seconds];
}

#pragma mark - ABI47_0_0EXAVObject

- (void)pauseImmediately
{
  if (_player) {
    [_player pause];
  }
}

- (ABI47_0_0EXAVAudioSessionMode)getAudioSessionModeRequired
{
  if (_player && ([self _isPlayerPlaying] || [self _shouldPlayerPlay])) {
    return _isMuted ? ABI47_0_0EXAVAudioSessionModeActiveMuted : ABI47_0_0EXAVAudioSessionModeActive;
  }
  return ABI47_0_0EXAVAudioSessionModeInactive;
}

- (void)appDidForeground
{
  [self _tryPlayPlayerWithRateAndMuteIfNecessary];
}

- (void)appDidBackgroundStayActive:(BOOL)stayActive
{
  // ABI47_0_0EXAudio already forced pause.
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
    
  ABI47_0_0EX_WEAKIFY(self);
  _loadFinishBlock = ^(BOOL success, NSDictionary *successStatus, NSString *error) {
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    if (finishCallback != nil) {
      finishCallback();
    }
    if (self.statusUpdateCallback == nil) {
      self.statusUpdateCallback = callback;
    }
    [self _callStatusUpdateCallback];
    if (!success && self.errorCallback) {
      self.errorCallback(error);
    }
  };
  
  [self _removeTimeObserver];
  [self _removeObservers];
  
  [self _loadNewPlayer];
}

#pragma mark - NSObject Lifecycle

/*
 * Call this synchronously on the main thread to remove the ABI47_0_0EXAVPlayerData
 * as an observer before KVO messages are broadcasted on the main thread.
 */
- (void)cleanup
{
  // this triggers the audio tap removal
  [self setSampleBufferCallback:nil];
  [self _removeTimeObserver];
  [self _removeObservers];
}

- (void)dealloc
{
  [self cleanup];
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
