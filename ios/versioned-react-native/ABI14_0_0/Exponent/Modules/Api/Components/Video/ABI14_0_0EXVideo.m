// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import "ABI14_0_0EXUnversioned.h"
#import "ABI14_0_0EXVideo.h"

#import <ReactABI14_0_0/ABI14_0_0RCTAssert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTBridgeModule.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>
#import <ReactABI14_0_0/ABI14_0_0RCTUtils.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>

static NSString *const ABI14_0_0EXVideoStatusKeyPath = @"status";
static NSString *const ABI14_0_0EXVideoPlaybackLikelyToKeepUpKeyPath = @"playbackLikelyToKeepUp";
static NSString *const ABI14_0_0EXVideoPlaybackBufferEmptyKeyPath = @"playbackBufferEmpty";
static NSString *const ABI14_0_0EXVideoReadyForDisplayKeyPath = @"readyForDisplay";
static NSString *const ABI14_0_0EXVideoPlaybackRateKeyPath = @"rate";

@interface ABI14_0_0EXVideo ()

@property (nonatomic, strong) NSString *resizeMode;
@property (nonatomic, strong) NSDictionary *src;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoLoadStart;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoLoad;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoError;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoProgress;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoSeek;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoEnd;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoFullscreenPlayerWillPresent;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoFullscreenPlayerDidPresent;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoFullscreenPlayerWillDismiss;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onVideoFullscreenPlayerDidDismiss;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onPlaybackStalled;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onPlaybackResume;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onPlaybackRateChange;

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) AVPlayerItem *playerItem;
@property (nonatomic, assign) BOOL playerItemObserversSet;
@property (nonatomic, assign) BOOL playerBufferEmpty;
@property (nonatomic, strong) AVPlayerLayer *playerLayer;
@property (nonatomic, strong) AVPlayerViewController *playerViewController;

@property (nonatomic, assign) BOOL playbackRateObserverRegistered;

@property (nonatomic, assign) BOOL pendingSeek;
@property (nonatomic, assign) float pendingSeekTime;
@property (nonatomic, assign) float lastSeekTime;

@property (nonatomic, assign) Float64 progressUpdateInterval;
@property (nonatomic, assign) BOOL controls;
@property (nonatomic, strong) id timeObserver;

@property (nonatomic, assign) float volume;
@property (nonatomic, assign) float rate;
@property (nonatomic, assign) BOOL muted;
@property (nonatomic, assign) BOOL paused;
@property (nonatomic, assign) BOOL repeat;
@property (nonatomic, assign) BOOL playbackStalled;
@property (nonatomic, assign) BOOL fullscreenPlayerPresented;
@property (nonatomic, strong) UIViewController *presentingViewController;
@property (nonatomic, assign) BOOL backgrounded;

@end

@implementation ABI14_0_0EXVideo

- (instancetype)initWithBridge:(ABI14_0_0RCTBridge *)bridge
{
  if ((self = [super init])) {
    _playbackRateObserverRegistered = NO;
    _playbackStalled = NO;
    _rate = 1.0;
    _volume = 1.0;
    _resizeMode = @"AVLayerVideoGravityResizeAspectFill";
    _pendingSeek = NO;
    _pendingSeekTime = 0.0f;
    _lastSeekTime = 0.0f;
    _progressUpdateInterval = 250;
    _controls = NO;
    _playerBufferEmpty = YES;
    _backgrounded = NO;
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:@"EXKernelBridgeDidForegroundNotification"
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:@"EXKernelBridgeDidBackgroundNotification"
                                             object:bridge];
  return self;
}

- (AVPlayerViewController*)createPlayerViewController:(AVPlayer*)player withPlayerItem:(AVPlayerItem*)playerItem
{
  ABI14_0_0EXVideoPlayerViewController* playerLayer = [[ABI14_0_0EXVideoPlayerViewController alloc] init];
  playerLayer.showsPlaybackControls = NO;
  playerLayer.rctDelegate = self;
  playerLayer.view.frame = self.bounds;
  playerLayer.player = _player;
  playerLayer.view.frame = self.bounds;
  return playerLayer;
}

- (CMTime)playerItemDuration
{
  AVPlayerItem *playerItem = [_player currentItem];
  if (playerItem.status == AVPlayerItemStatusReadyToPlay) {
    return [playerItem duration];
  }

  return kCMTimeInvalid;
}

- (void)removePlayerTimeObserver
{
  if (_timeObserver) {
    [_player removeTimeObserver:_timeObserver];
    _timeObserver = nil;
  }
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  _backgrounded = NO;
  [self applyModifiers];
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  _backgrounded = YES;
  [_player pause];
  [_player setRate:0.0];
}

- (void)sendProgressUpdate
{
  AVPlayerItem *video = [_player currentItem];
  if (video == nil || video.status != AVPlayerItemStatusReadyToPlay) {
    return;
  }

  CMTime playerDuration = [self playerItemDuration];
  if (CMTIME_IS_INVALID(playerDuration)) {
    return;
  }

  CMTime currentTime = _player.currentTime;
  const Float64 duration = CMTimeGetSeconds(playerDuration);
  const Float64 currentTimeSecs = CMTimeGetSeconds(currentTime);
  if ( currentTimeSecs >= 0 && currentTimeSecs <= duration) {
    if (_onVideoProgress) {
      _onVideoProgress(@{
                         @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(currentTime)],
                         @"playableDuration": [self calculatePlayableDuration],
                         @"atValue": [NSNumber numberWithLongLong:currentTime.value],
                         @"atTimescale": [NSNumber numberWithInt:currentTime.timescale],
                         });
    }
  }
}

- (NSNumber *)calculatePlayableDuration
{
  AVPlayerItem *video = _player.currentItem;
  if (video.status == AVPlayerItemStatusReadyToPlay) {
    __block CMTimeRange effectiveTimeRange;
    [video.loadedTimeRanges enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
      CMTimeRange timeRange = [obj CMTimeRangeValue];
      if (CMTimeRangeContainsTime(timeRange, video.currentTime)) {
        effectiveTimeRange = timeRange;
        *stop = YES;
      }
    }];
    Float64 playableDuration = CMTimeGetSeconds(CMTimeRangeGetEnd(effectiveTimeRange));
    if (playableDuration > 0) {
      return [NSNumber numberWithFloat:playableDuration];
    }
  }
  return [NSNumber numberWithInteger:0];
}

- (void)addPlayerItemObservers
{
  [_playerItem addObserver:self forKeyPath:ABI14_0_0EXVideoStatusKeyPath options:0 context:nil];
  [_playerItem addObserver:self forKeyPath:ABI14_0_0EXVideoPlaybackBufferEmptyKeyPath options:0 context:nil];
  [_playerItem addObserver:self forKeyPath:ABI14_0_0EXVideoPlaybackLikelyToKeepUpKeyPath options:0 context:nil];
  _playerItemObserversSet = YES;
}

- (void)removePlayerItemObservers
{
  if (_playerItemObserversSet) {
    [_playerItem removeObserver:self forKeyPath:ABI14_0_0EXVideoStatusKeyPath];
    [_playerItem removeObserver:self forKeyPath:ABI14_0_0EXVideoPlaybackBufferEmptyKeyPath];
    [_playerItem removeObserver:self forKeyPath:ABI14_0_0EXVideoPlaybackLikelyToKeepUpKeyPath];
    _playerItemObserversSet = NO;
  }
}

- (void)setSrc:(NSDictionary *)source
{
  _src = source;

  [self removePlayerTimeObserver];
  [self removePlayerItemObservers];
  _playerItem = [self playerItemForSource:source];
  [self addPlayerItemObservers];

  [_player pause];
  [self removePlayerLayer];
  [_playerViewController.view removeFromSuperview];
  _playerViewController = nil;

  if (_playbackRateObserverRegistered) {
    [_player removeObserver:self forKeyPath:ABI14_0_0EXVideoPlaybackRateKeyPath context:nil];
    _playbackRateObserverRegistered = NO;
  }

  _player = [AVPlayer playerWithPlayerItem:_playerItem];
  _player.actionAtItemEnd = AVPlayerActionAtItemEndNone;

  [_player addObserver:self forKeyPath:ABI14_0_0EXVideoPlaybackRateKeyPath options:0 context:nil];
  _playbackRateObserverRegistered = YES;

  const Float64 progressUpdateIntervalMS = _progressUpdateInterval / 1000;
  // @see endScrubbing in AVPlayerDemoPlaybackViewController.m of https://developer.apple.com/library/ios/samplecode/AVPlayerDemo/Introduction/Intro.html
  __weak ABI14_0_0EXVideo *weakSelf = self;
  _timeObserver = [_player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(progressUpdateIntervalMS, NSEC_PER_SEC)
                                                        queue:NULL
                                                   usingBlock:^(CMTime time) { [weakSelf sendProgressUpdate]; }
                   ];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  // Do this in didSetProps so that all props are set by now
  if ([changedProps containsObject:@"src"]) {
    if (_onVideoLoadStart) {
      _onVideoLoadStart(@{
                          @"uri": [_src objectForKey:@"uri"],
                          // @"type": [_src objectForKey:@"type"],
                          // @"isNetwork":[NSNumber numberWithBool:(BOOL)[_src objectForKey:@"isNetwork"]]
                          });
    }
  }
}

- (AVPlayerItem*)playerItemForSource:(NSDictionary *)source
{
  BOOL isNetwork = [ABI14_0_0RCTConvert BOOL:[source objectForKey:@"isNetwork"]];
  BOOL isAsset = [ABI14_0_0RCTConvert BOOL:[source objectForKey:@"isAsset"]];
  NSString *uri = [source objectForKey:@"uri"];

  NSURL *url;
  if (isNetwork || isAsset)  {
    url = [NSURL URLWithString:uri];
  } else {
    ABI14_0_0RCTFatal(ABI14_0_0RCTErrorWithMessage(@"Source must specify isNetwork or isAsset"));
    return nil;
  }

  if (isAsset) {
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    return [AVPlayerItem playerItemWithAsset:asset];
  }

  return [AVPlayerItem playerItemWithURL:url];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if (object == _playerItem) {
    if ([keyPath isEqualToString:ABI14_0_0EXVideoStatusKeyPath]) {
      // Handle player item status change.
      if (_playerItem.status == AVPlayerItemStatusReadyToPlay) {
        float duration = CMTimeGetSeconds(_playerItem.asset.duration);

        if (isnan(duration)) {
          duration = 0.0;
        }

        NSObject *width = @"undefined";
        NSObject *height = @"undefined";
        NSString *orientation = @"undefined";

        if ([_playerItem.asset tracksWithMediaType:AVMediaTypeVideo].count > 0) {
          AVAssetTrack *videoTrack = [[_playerItem.asset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0];
          width = [NSNumber numberWithFloat:videoTrack.naturalSize.width];
          height = [NSNumber numberWithFloat:videoTrack.naturalSize.height];
          CGAffineTransform preferredTransform = [videoTrack preferredTransform];

          if ((videoTrack.naturalSize.width == preferredTransform.tx
               && videoTrack.naturalSize.height == preferredTransform.ty)
              || (preferredTransform.tx == 0 && preferredTransform.ty == 0))
          {
            orientation = @"landscape";
          } else
            orientation = @"portrait";
        }

        if (_onVideoLoad) {
          _onVideoLoad(@{
                         @"duration": [NSNumber numberWithFloat:duration],
                         @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(_playerItem.currentTime)],
                         @"canPlayReverse": [NSNumber numberWithBool:_playerItem.canPlayReverse],
                         @"canPlayFastForward": [NSNumber numberWithBool:_playerItem.canPlayFastForward],
                         @"canPlaySlowForward": [NSNumber numberWithBool:_playerItem.canPlaySlowForward],
                         @"canPlaySlowReverse": [NSNumber numberWithBool:_playerItem.canPlaySlowReverse],
                         @"canStepBackward": [NSNumber numberWithBool:_playerItem.canStepBackward],
                         @"canStepForward": [NSNumber numberWithBool:_playerItem.canStepForward],
                         @"naturalSize": @{
                             @"width": width,
                             @"height": height,
                             @"orientation": orientation
                             },
                         });
        }

        [self attachListeners];
        [self applyModifiers];
      } else if (_playerItem.status == AVPlayerItemStatusFailed) {
        if (_onVideoError) {
          _onVideoError(@{
                          @"error": @{
                              @"code": [NSNumber numberWithInteger: _playerItem.error.code],
                              @"domain": _playerItem.error.domain},
                          });
        }
      }
    } else if ([keyPath isEqualToString:ABI14_0_0EXVideoPlaybackBufferEmptyKeyPath]) {
      _playerBufferEmpty = YES;
    } else if ([keyPath isEqualToString:ABI14_0_0EXVideoPlaybackLikelyToKeepUpKeyPath]) {
      // Continue playing (or not if paused) after being paused due to hitting an unbuffered zone.
      if ((!_controls || _playerBufferEmpty) && _playerItem.playbackLikelyToKeepUp) {
        [self setPaused:_paused];
      }
      _playerBufferEmpty = NO;
    }
  } else if (object == _playerLayer) {
    if ([keyPath isEqualToString:ABI14_0_0EXVideoReadyForDisplayKeyPath] && [change objectForKey:NSKeyValueChangeNewKey]) {
      if ([change objectForKey:NSKeyValueChangeNewKey]) {
        if (_onReadyForDisplay) {
          _onReadyForDisplay(nil);
        }
      }
    }
  } else if (object == _player) {
    if ([keyPath isEqualToString:ABI14_0_0EXVideoPlaybackRateKeyPath]) {
      if (_onPlaybackRateChange) {
        _onPlaybackRateChange(@{@"playbackRate": [NSNumber numberWithFloat:_player.rate]});
      }
      if (_playbackStalled && _player.rate > 0) {
        if (_onPlaybackResume) {
          _onPlaybackResume(@{@"playbackRate": [NSNumber numberWithFloat:_player.rate]});
        }
        _playbackStalled = NO;
      }
    }
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

- (void)attachListeners
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(playerItemDidReachEnd:)
                                               name:AVPlayerItemDidPlayToEndTimeNotification
                                             object:[_player currentItem]];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(playbackStalled:)
                                               name:AVPlayerItemPlaybackStalledNotification
                                             object:nil];
}

- (void)playbackStalled:(NSNotification *)notification
{
  if (_onPlaybackStalled) {
    _onPlaybackStalled(nil);
  }
  _playbackStalled = YES;
}

- (void)playerItemDidReachEnd:(NSNotification *)notification
{
  if (_onVideoEnd) {
    _onVideoEnd(nil);
  }

  if (_repeat) {
    AVPlayerItem *item = [notification object];
    [item seekToTime:kCMTimeZero];
    [self applyModifiers];
  }
}

- (void)setResizeMode:(NSString*)mode
{
  if (_controls)
  {
    _playerViewController.videoGravity = mode;
  }
  else
  {
    _playerLayer.videoGravity = mode;
  }
  _resizeMode = mode;
}

- (void)setPaused:(BOOL)paused
{
  if (paused || _backgrounded) {
    [_player pause];
    [_player setRate:0.0];
  } else {
    [_player play];
    [_player setRate:_rate];
  }

  _paused = paused;
}

- (float)getCurrentTime
{
  return _playerItem != NULL ? CMTimeGetSeconds(_playerItem.currentTime) : 0;
}

- (void)setCurrentTime:(float)currentTime
{
  [self setSeek: currentTime];
}

- (void)setSeek:(float)seekTime
{
  int timeScale = 10000;

  AVPlayerItem *item = _player.currentItem;
  if (item && item.status == AVPlayerItemStatusReadyToPlay) {
    // TODO: check loadedTimeRanges
    CMTime cmSeekTime = CMTimeMakeWithSeconds(seekTime, timeScale);
    CMTime current = item.currentTime;
    CMTime tolerance = CMTimeMake(1000, timeScale); // TODO: figure out a good tolerance

    if (CMTimeCompare(current, cmSeekTime) != 0) {
      [_player seekToTime:cmSeekTime toleranceBefore:tolerance toleranceAfter:tolerance completionHandler:^(BOOL finished) {
        if (_onVideoSeek) {
          _onVideoSeek(@{
                         @"currentTime": [NSNumber numberWithFloat:CMTimeGetSeconds(item.currentTime)],
                         @"seekTime": [NSNumber numberWithFloat:seekTime],
                         });
        }
      }];

      _pendingSeek = NO;
    }

  } else {
    // TODO: See if this makes sense and if so, actually implement it
    _pendingSeek = YES;
    _pendingSeekTime = seekTime;
  }
}

- (void)setRate:(float)rate
{
  _rate = rate;
  [self applyModifiers];
}

- (void)setMuted:(BOOL)muted
{
  _muted = muted;
  [self applyModifiers];
}

- (void)setVolume:(float)volume
{
  _volume = volume;
  [self applyModifiers];
}

- (void)applyModifiers
{
  if (_muted) {
    [_player setVolume:0];
    [_player setMuted:YES];
  } else {
    [_player setVolume:_volume];
    [_player setMuted:NO];
  }

  [self setResizeMode:_resizeMode];
  [self setRepeat:_repeat];
  [self setPaused:_paused];
  [self setControls:_controls];
}

- (BOOL)getFullscreen
{
  return _fullscreenPlayerPresented;
}

- (void)setFullscreen:(BOOL)fullscreen
{
  if (fullscreen && !_fullscreenPlayerPresented)
  {
    // Ensure player view controller is not null
    if (!_playerViewController)
    {
      [self usePlayerViewController];
    }
    // Set presentation style to fullscreen
    [_playerViewController setModalPresentationStyle:UIModalPresentationFullScreen];

    // Find the nearest view controller
    UIViewController *viewController = [self firstAvailableUIViewController];
    if (!viewController)
    {
      UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
      viewController = keyWindow.rootViewController;
      if (viewController.childViewControllers.count > 0)
      {
        viewController = viewController.childViewControllers.lastObject;
      }
    }
    if (viewController)
    {
      _presentingViewController = viewController;
      if (_onVideoFullscreenPlayerWillPresent) {
        _onVideoFullscreenPlayerWillPresent(nil);
      }
      [viewController presentViewController:_playerViewController animated:YES completion:^{
        _playerViewController.showsPlaybackControls = YES;
        _fullscreenPlayerPresented = fullscreen;
        if (_onVideoFullscreenPlayerDidPresent) {
          _onVideoFullscreenPlayerDidPresent(nil);
        }
      }];
    }
  }
  else if (!fullscreen && _fullscreenPlayerPresented)
  {
    [self videoPlayerViewControllerWillDismiss:_playerViewController];
    [_presentingViewController dismissViewControllerAnimated:YES completion:^{
      [self videoPlayerViewControllerDidDismiss:_playerViewController];
    }];
  }
}

- (void)usePlayerViewController
{
  if (_player)
  {
    _playerViewController = [self createPlayerViewController:_player withPlayerItem:_playerItem];
    [self addSubview:_playerViewController.view];
  }
}

- (void)usePlayerLayer
{
  if (_player)
  {
    _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
    _playerLayer.frame = self.bounds;
    _playerLayer.needsDisplayOnBoundsChange = YES;

    [_playerLayer addObserver:self forKeyPath:ABI14_0_0EXVideoReadyForDisplayKeyPath options:NSKeyValueObservingOptionNew context:nil];

    [self.layer addSublayer:_playerLayer];
    self.layer.needsDisplayOnBoundsChange = YES;
  }
}

- (void)setControls:(BOOL)controls
{
  if (_controls != controls || (!_playerLayer && !_playerViewController))
  {
    _controls = controls;
    if (_controls)
    {
      [self removePlayerLayer];
      [self usePlayerViewController];
    }
    else
    {
      [_playerViewController.view removeFromSuperview];
      _playerViewController = nil;
      [self usePlayerLayer];
    }
  }
}

- (void)removePlayerLayer
{
  [_playerLayer removeFromSuperlayer];
  [_playerLayer removeObserver:self forKeyPath:ABI14_0_0EXVideoReadyForDisplayKeyPath];
  _playerLayer = nil;
}

#pragma mark - ABI14_0_0EXVideoPlayerViewControllerDelegate

- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController
{
  if (_playerViewController == playerViewController && _fullscreenPlayerPresented)
  {
    if (_onVideoFullscreenPlayerWillDismiss) {
      _onVideoFullscreenPlayerWillDismiss(nil);
    }
  }
}

- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController
{
  if (_playerViewController == playerViewController && _fullscreenPlayerPresented)
  {
    _fullscreenPlayerPresented = NO;
    _presentingViewController = nil;
    [self applyModifiers];
    if (_onVideoFullscreenPlayerWillDismiss) {
      _onVideoFullscreenPlayerWillDismiss(nil);
    }
  }
}

#pragma mark - ReactABI14_0_0 View Management

- (void)insertReactABI14_0_0Subview:(UIView *)view atIndex:(NSInteger)atIndex
{
  // We are early in the game and somebody wants to set a subview.
  // That can only be in the context of playerViewController.
  if (!_controls && !_playerLayer && !_playerViewController)
  {
    [self setControls:YES];
  }

  if (_controls)
  {
    [super insertReactABI14_0_0Subview:view atIndex:atIndex];
    view.frame = self.bounds;
    [_playerViewController.contentOverlayView insertSubview:view atIndex:atIndex];
  }
  else
  {
    ABI14_0_0RCTLogError(@"video cannot have any subviews");
  }
  return;
}

- (void)removeReactABI14_0_0Subview:(UIView *)subview
{
  if (_controls)
  {
    [super removeReactABI14_0_0Subview:subview];
    [subview removeFromSuperview];
  }
  else
  {
    ABI14_0_0RCTLogError(@"video cannot have any subviews");
  }
  return;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_controls)
  {
    _playerViewController.view.frame = self.bounds;

    // also adjust all subviews of contentOverlayView
    for (UIView* subview in _playerViewController.contentOverlayView.subviews) {
      subview.frame = self.bounds;
    }
  }
  else
  {
    [CATransaction begin];
    [CATransaction setAnimationDuration:0];
    _playerLayer.frame = self.bounds;
    [CATransaction commit];
  }
}

#pragma mark - Lifecycle

- (void)removeFromSuperview
{
  [_player pause];
  if (_playbackRateObserverRegistered) {
    [_player removeObserver:self forKeyPath:ABI14_0_0EXVideoPlaybackRateKeyPath context:nil];
    _playbackRateObserverRegistered = NO;
  }
  _player = nil;

  [self removePlayerLayer];

  [_playerViewController.view removeFromSuperview];
  _playerViewController = nil;

  [self removePlayerTimeObserver];
  [self removePlayerItemObservers];

  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [super removeFromSuperview];
}

@end
