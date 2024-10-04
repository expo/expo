// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>
#import <ABI42_0_0EXAV/ABI42_0_0EXAV.h>
#import <ABI42_0_0EXAV/ABI42_0_0EXVideoView.h>
#import <ABI42_0_0EXAV/ABI42_0_0EXAVPlayerData.h>
#import <ABI42_0_0EXAV/ABI42_0_0EXVideoPlayerViewController.h>

static NSString *const ABI42_0_0EXVideoReadyForDisplayKeyPath = @"readyForDisplay";
static NSString *const ABI42_0_0EXVideoSourceURIKeyPath = @"uri";
static NSString *const ABI42_0_0EXVideoSourceHeadersKeyPath = @"headers";
static NSString *const ABI42_0_0EXVideoBoundsKeyPath = @"videoBounds";
static NSString *const ABI42_0_0EXAVFullScreenViewControllerClassName = @"AVFullScreenViewController";

@interface ABI42_0_0EXVideoView ()

@property (nonatomic, weak) ABI42_0_0EXAV *exAV;

@property (nonatomic, assign) BOOL playerHasLoaded;
@property (nonatomic, strong) ABI42_0_0EXAVPlayerData *data;
@property (nonatomic, strong) AVPlayerLayer *playerLayer;
@property (nonatomic, strong) ABI42_0_0EXVideoPlayerViewController *playerViewController;

@property (nonatomic, assign) BOOL fullscreenPlayerIsDismissing;
@property (nonatomic, strong) ABI42_0_0EXVideoPlayerViewController *fullscreenPlayerViewController;
@property (nonatomic, strong) ABI42_0_0UMPromiseResolveBlock requestedFullscreenChangeResolver;
@property (nonatomic, strong) ABI42_0_0UMPromiseRejectBlock requestedFullscreenChangeRejecter;
@property (nonatomic, assign) BOOL requestedFullscreenChange;

@property (nonatomic, strong) UIViewController *presentingViewController;
@property (nonatomic, assign) BOOL fullscreenPlayerPresented;

@property (nonatomic, strong) NSDictionary *lastSetSource;
@property (nonatomic, strong) NSMutableDictionary *statusToSet;

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI42_0_0EXVideoView

#pragma mark - ABI42_0_0EXVideoView interface methods

- (instancetype)initWithModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  if ((self = [super init])) {
    _moduleRegistry = moduleRegistry;
    _exAV = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXAVInterface)];
    [_exAV registerVideoForAudioLifecycle:self];
    
    _data = nil;
    _playerLayer = nil;
    _playerHasLoaded = NO;
    _playerViewController = nil;
    _presentingViewController = nil;
    _fullscreenPlayerPresented = NO;
    _fullscreenPlayerViewController = nil;
    _requestedFullscreenChangeResolver = nil;
    _requestedFullscreenChangeRejecter = nil;
    _fullscreenPlayerIsDismissing = NO;
    _requestedFullscreenChange = NO;
    _statusToSet = [NSMutableDictionary new];
    _useNativeControls = NO;
    _nativeResizeMode = AVLayerVideoGravityResizeAspectFill;
  }
  
  return self;
}

#pragma mark - callback helper methods

- (void)_callFullscreenCallbackForUpdate:(ABI42_0_0EXVideoFullscreenUpdate)update
{
  if (_onFullscreenUpdate) {
    _onFullscreenUpdate(@{@"fullscreenUpdate": @(update),
                          @"status": [_data getStatus]});
  }
}

- (void)_callErrorCallback:(NSString *)error
{
  if (_onError) {
    _onError(@{@"error": error});
  }
}

#pragma mark - Player and source

- (void)_tryUpdateDataStatus:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (_data) {
    if ([_statusToSet count] > 0) {
      NSMutableDictionary *newStatus = [NSMutableDictionary dictionaryWithDictionary:_statusToSet];
      [_statusToSet removeAllObjects];
      [_data setStatus:newStatus resolver:resolve rejecter:reject];
    } else if (resolve) {
      resolve([_data getStatus]);
    }
  } else if (resolve) {
    resolve([ABI42_0_0EXAVPlayerData getUnloadedStatus]);
  }
}

- (void)_updateForNewPlayer
{
  [self setPlayerHasLoaded:YES];
  [self setUseNativeControls:_useNativeControls];
  if (_onLoad) {
    _onLoad([self getStatus]);
  }
  if (_requestedFullscreenChangeResolver || _requestedFullscreenChangeRejecter) {
    [self setFullscreen:_requestedFullscreenChange resolver:_requestedFullscreenChangeResolver rejecter:_requestedFullscreenChangeRejecter];
    _requestedFullscreenChangeResolver = nil;
    _requestedFullscreenChangeRejecter = nil;
    _requestedFullscreenChange = NO;
  }
}

- (void)_removeData
{
  if (_data) {
    [_data pauseImmediately];
    [_data setStatusUpdateCallback:nil];
    [_exAV demoteAudioSessionIfPossible];
    _data = nil;
  }
}

- (void)_removePlayer
{
  if (_requestedFullscreenChangeRejecter) {
    _requestedFullscreenChangeRejecter(@"E_VIDEO_FULLSCREEN", @"Player is being removed, cancelling fullscreen change request.", nil);
    _requestedFullscreenChangeResolver = nil;
    _requestedFullscreenChangeRejecter = nil;
    _requestedFullscreenChange = NO;
  }
  
  // Any ViewController/layer updates need to be
  // executed on the main UI thread.
  ABI42_0_0UM_WEAKIFY(self);
  void (^block)(void) = ^ {
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    [self _removeFullscreenPlayerViewController];
    [self _removePlayerLayer];
    [self _removePlayerViewController];
  };
  _playerHasLoaded = NO;
  [ABI42_0_0UMUtilities performSynchronouslyOnMainThread:block];
}

#pragma mark - _playerViewController / _playerLayer management

- (ABI42_0_0EXVideoPlayerViewController *)_createNewPlayerViewController
{
  if (_data == nil) {
    return nil;
  }
  ABI42_0_0EXVideoPlayerViewController *controller = [[ABI42_0_0EXVideoPlayerViewController alloc] init];
  [controller setShowsPlaybackControls:_useNativeControls];
  [controller setRctDelegate:self];
  [controller setDelegate:self];
  [controller.view setFrame:self.bounds];
  [controller setPlayer:_data.player];
  [controller addObserver:self forKeyPath:ABI42_0_0EXVideoReadyForDisplayKeyPath options:NSKeyValueObservingOptionNew context:nil];
  return controller;
}

- (void)_usePlayerLayer
{
  if (_data) {
    _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_data.player];
    [_playerLayer setFrame:self.bounds];
    [_playerLayer setNeedsDisplayOnBoundsChange:YES];
    [_playerLayer addObserver:self forKeyPath:ABI42_0_0EXVideoReadyForDisplayKeyPath options:NSKeyValueObservingOptionNew context:nil];
    
    // Resize mode must be set before layer is added
    // to prevent video from being animated when `resizeMode` is `cover`
    [self _updateNativeResizeMode];
    
    [self.layer addSublayer:_playerLayer];
    [self.layer setNeedsDisplayOnBoundsChange:YES];
  }
}

- (void)_removePlayerLayer
{
  if (_playerLayer) {
    [_playerLayer removeFromSuperlayer];
    [_playerLayer removeObserver:self forKeyPath:ABI42_0_0EXVideoReadyForDisplayKeyPath];
    _playerLayer = nil;
  }
}

- (void)_removeFullscreenPlayerViewController
{
  if (_fullscreenPlayerViewController) {
    [_fullscreenPlayerViewController removeObserver:self forKeyPath:ABI42_0_0EXVideoReadyForDisplayKeyPath];
    _fullscreenPlayerViewController = nil;
  }
}

- (void)_removePlayerViewController
{
  if (_playerViewController) {
    [_playerViewController.view removeFromSuperview];
    [_playerViewController removeObserver:self forKeyPath:ABI42_0_0EXVideoReadyForDisplayKeyPath];
    if (@available(iOS 12, *)) {
      // ABI42_0_0EXVideoBounds monitoring is only used as a fallback on iOS 11 or lower
    } else {
      [_playerViewController removeObserver:self forKeyPath:ABI42_0_0EXVideoBoundsKeyPath];
    }
    _playerViewController = nil;
  }
}


#pragma mark - Observers

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if ((object == _playerLayer || object == _playerViewController || object == _fullscreenPlayerViewController) && [keyPath isEqualToString:ABI42_0_0EXVideoReadyForDisplayKeyPath]) {
    if ([change objectForKey:NSKeyValueChangeNewKey] && _onReadyForDisplay) {
      // Calculate natural size of video:
      NSDictionary *naturalSize;
      
      if ([_data.player.currentItem.asset tracksWithMediaType:AVMediaTypeVideo].count > 0) {
        AVAssetTrack *videoTrack = [[_data.player.currentItem.asset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0];
        
        // Videos can specify whether they should be rotated when displayed,
        // using a transform matrix. We apply the transform matrix to get the
        // actual size that will be displayed on screen.
        CGSize actualSize = CGSizeApplyAffineTransform(videoTrack.naturalSize, videoTrack.preferredTransform);
        
        // The rotation transform can result in negative widths/heights, so we
        // need to make sure we return positive numbers that make sense.
        CGFloat width = fabs(actualSize.width);
        CGFloat height = fabs(actualSize.height);
        
        naturalSize = @{@"width": @(width),
                        @"height": @(height),
                        @"orientation": width < height ? @"portrait" : @"landscape"};
      } else {
        
        // For certain Assets (e.g. AVURLAsset/HSL-streams/m3u8 files), the natural size
        // cannot be obtained from AVAssetTrack. In these cases fallback to using
        // the presentationSize from AVPlayerItem.
        // https://stackoverflow.com/questions/48553686/avfoundation-how-can-you-get-the-video-dimensions-of-a-video-being-streamed-by
        CGSize presentationSize = _data.player.currentItem.presentationSize;
        naturalSize = @{@"width": @(presentationSize.width),
                        @"height": @(presentationSize.height),
                        @"orientation": @"landscape"};
      }
      
      _onReadyForDisplay(@{@"naturalSize": naturalSize,
                           @"status": [_data getStatus]});
    }
    
    // On iOS 11 or lower, use video-bounds monitoring to detect changes in the full-screen
    // mode due to activating native controls
  } else if (object == _playerViewController && [keyPath isEqualToString:ABI42_0_0EXVideoBoundsKeyPath]) {
    CGRect viewBounds = [change[@"new"] CGRectValue];
    CGRect screen = [[UIScreen mainScreen] bounds];
    if (viewBounds.size.height != screen.size.height && viewBounds.size.width != screen.size.width && _fullscreenPlayerPresented && !_fullscreenPlayerViewController) {
      // Fullscreen player is being dismissed
      _fullscreenPlayerPresented = NO;
      [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerWillDismiss];
      [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerDidDismiss];
    } else if (viewBounds.size.height == screen.size.height && viewBounds.size.width == screen.size.width && !_fullscreenPlayerPresented) {
      // Fullscreen player is being presented
      _fullscreenPlayerPresented = YES;
      [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerWillPresent];
      [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerDidPresent];
    } else {
      return;
    }
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

#pragma mark - Imperative API

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
         rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (_data) {
    [_statusToSet addEntriesFromDictionary:[_data getStatus]];
    [self _removeData];
  }
  
  [self _removePlayer];
  
  if (initialStatus) {
    [_statusToSet addEntriesFromDictionary:initialStatus];
  }
  
  if (source == nil) {
    if (resolve) {
      resolve([ABI42_0_0EXAVPlayerData getUnloadedStatus]);
    }
    return;
  }
  
  NSMutableDictionary *statusToInitiallySet = [NSMutableDictionary dictionaryWithDictionary:_statusToSet];
  [_statusToSet removeAllObjects];
  
  ABI42_0_0UM_WEAKIFY(self);
  
  void (^statusUpdateCallback)(NSDictionary *) = ^(NSDictionary *status) {
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    if (self.onStatusUpdate) {
      self.onStatusUpdate(status);
    }
  };
  
  void (^errorCallback)(NSString *) = ^(NSString *error) {
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    [self _removeData];
    [self _removePlayer];
    [self _callErrorCallback:error];
  };
  
  _data = [[ABI42_0_0EXAVPlayerData alloc] initWithEXAV:_exAV
                                    withSource:source
                                    withStatus:statusToInitiallySet
                           withLoadFinishBlock:^(BOOL success, NSDictionary *successStatus, NSString *error) {
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    if (success) {
      [self _updateForNewPlayer];
      if (resolve) {
        resolve(successStatus);
      }
    } else {
      [self _removeData];
      [self _removePlayer];
      if (reject) {
        reject(@"E_VIDEO_NOTCREATED", error, nil);
      }
      [self _callErrorCallback:error];
    }
  }];
  [_data setStatusUpdateCallback:statusUpdateCallback];
  [_data setErrorCallback:errorCallback];
  
  // Call onLoadStart on next run loop, otherwise it might not be set yet (if it is set at the same time as uri, via props)
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t) 0), dispatch_get_main_queue(), ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    if (self.onLoadStart) {
      self.onLoadStart(nil);
    }
  });
}

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
         rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (status != nil) {
    [_statusToSet addEntriesFromDictionary:status];
  }
  [self _tryUpdateDataStatus:resolve rejecter:reject];
}

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (status != nil) {
    [_statusToSet addEntriesFromDictionary:status];
  }
  
  NSMutableDictionary *newStatus = [NSMutableDictionary dictionaryWithDictionary:_statusToSet];
  [_statusToSet removeAllObjects];
  
  [_data replayWithStatus:newStatus resolver:resolve rejecter:reject];
}

- (void)setFullscreen:(BOOL)value
             resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
             rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (!_data) {
    // Tried to set fullscreen for an unloaded component.
    if (reject) {
      reject(@"E_VIDEO_FULLSCREEN", @"Fullscreen encountered an error: video is not loaded.", nil);
    }
    return;
  } else if (!_playerHasLoaded) {
    // `setUri` has been called, but the video has not yet loaded.
    if (_requestedFullscreenChangeRejecter) {
      _requestedFullscreenChangeRejecter(@"E_VIDEO_FULLSCREEN", @"Received newer request, cancelling fullscreen mode change request.", nil);
    }
    
    _requestedFullscreenChange = value;
    _requestedFullscreenChangeRejecter = reject;
    _requestedFullscreenChangeResolver = resolve;
    return;
  } else {
    ABI42_0_0UM_WEAKIFY(self);
    if (value && !_fullscreenPlayerPresented && !_fullscreenPlayerViewController) {
      _fullscreenPlayerViewController = [self _createNewPlayerViewController];
      
      // Resize mode must be set before layer is added
      // to prevent video from being animated when `resizeMode` is `cover`
      [self _updateNativeResizeMode];
      
      // Set presentation style to fullscreen
      [_fullscreenPlayerViewController setModalPresentationStyle:UIModalPresentationFullScreen];
      
      // Find the nearest view controller
      UIViewController *controller = [UIApplication sharedApplication].keyWindow.rootViewController;
      UIViewController *presentedController = controller.presentedViewController;
      while (presentedController && ![presentedController isBeingDismissed]) {
        controller = presentedController;
        presentedController = controller.presentedViewController;
      }
      
      _presentingViewController = controller;
      [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerWillPresent];
      
      dispatch_async(dispatch_get_main_queue(), ^{
        ABI42_0_0UM_ENSURE_STRONGIFY(self);
        self.fullscreenPlayerViewController.showsPlaybackControls = YES;
        [self.presentingViewController presentViewController:self.fullscreenPlayerViewController animated:YES completion:^{
          ABI42_0_0UM_ENSURE_STRONGIFY(self);
          self.fullscreenPlayerPresented = YES;
          [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerDidPresent];
          if (resolve) {
            resolve([self getStatus]);
          }
        }];
      });
    } else if (!value && _fullscreenPlayerPresented && !_fullscreenPlayerIsDismissing) {
      [self videoPlayerViewControllerWillDismiss:_fullscreenPlayerViewController];
      
      dispatch_async(dispatch_get_main_queue(), ^{
        ABI42_0_0UM_ENSURE_STRONGIFY(self);
        [self.presentingViewController dismissViewControllerAnimated:YES completion:^{
          ABI42_0_0UM_ENSURE_STRONGIFY(self);
          [self videoPlayerViewControllerDidDismiss:self.fullscreenPlayerViewController];
          if (resolve) {
            resolve([self getStatus]);
          }
        }];
      });
    } else if (value && !_fullscreenPlayerPresented && _fullscreenPlayerViewController && reject) {
      // Fullscreen player should be presented, is being presented, but hasn't been presented yet.
      reject(@"E_VIDEO_FULLSCREEN", @"Fullscreen player is already being presented. Await the first change request.", nil);
    } else if (!value && _fullscreenPlayerIsDismissing && _fullscreenPlayerViewController && reject) {
      // Fullscreen player should be dismissing, is already dismissing, but hasn't dismissed yet.
      reject(@"E_VIDEO_FULLSCREEN", @"Fullscreen player is already being dismissed. Await the first change request.", nil);
    } else if (!value && !_fullscreenPlayerPresented && _fullscreenPlayerViewController && reject) {
      // Fullscreen player is being presented and we receive request to dismiss it.
      reject(@"E_VIDEO_FULLSCREEN", @"Fullscreen player is being presented. Await the `present` request and then dismiss the player.", nil);
    } else if (value && _fullscreenPlayerIsDismissing && _fullscreenPlayerViewController && reject) {
      // Fullscreen player is being dismissed and we receive request to present it.
      reject(@"E_VIDEO_FULLSCREEN", @"Fullscreen player is being dismissed. Await the `dismiss` request and then present the player again.", nil);
    } else if (resolve) {
      // Fullscreen is already appropriately set.
      resolve([self getStatus]);
    }
  }
}

#pragma mark - Prop setters

- (void)setSource:(NSDictionary *)source
{
  if (![source isEqualToDictionary:_lastSetSource]) {
    ABI42_0_0UM_WEAKIFY(self);
    dispatch_async(_exAV.methodQueue, ^{
      ABI42_0_0UM_ENSURE_STRONGIFY(self);
      self.lastSetSource = source;
      [self setSource:source withStatus:nil resolver:nil rejecter:nil];
    });
  }
}

- (NSDictionary *)source
{
  return @{
    ABI42_0_0EXVideoSourceURIKeyPath: (_data != nil && _data.url != nil) ? _data.url.absoluteString : @"",
    ABI42_0_0EXVideoSourceHeadersKeyPath: _data.headers
  };
}

- (void)setUseNativeControls:(BOOL)useNativeControls
{
  _useNativeControls = useNativeControls;
  if (!_playerHasLoaded) {
    return;
  }
  
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    if (!self.playerHasLoaded) {
      return;
    }
    if (self.useNativeControls) {
      if (self.playerLayer) {
        [self _removePlayerLayer];
      }
      if (!self.playerViewController && self.data) {
        self.playerViewController = [self _createNewPlayerViewController];
        if (@available(iOS 12, *)) {
          // On iOS 12 or higher, use the AVPlayerViewControllerDelegate full-screen delegate methods:
          // https://stackoverflow.com/a/58809976/3785358
        } else {
          // On iOS 11 or earlier, fallback to listening for changes to `videoBounds`.
          // See https://stackoverflow.com/questions/36323259/detect-video-playing-full-screen-in-portrait-or-landscape/36388184#36388184
          // and https://github.com/expo/expo/issues/1566
          [self.playerViewController addObserver:self forKeyPath:ABI42_0_0EXVideoBoundsKeyPath options:NSKeyValueObservingOptionNew context:nil];
        }
        // Resize mode must be set before layer is added
        // to prevent video from being animated when `resizeMode` is `cover`
        [self _updateNativeResizeMode];
        [self addSubview:self.playerViewController.view];
      }
    } else {
      if (self.playerViewController) {
        [self _removePlayerViewController];
      }
      if (!self.playerLayer) {
        [self _usePlayerLayer];
      }
    }
  });
}

- (void)setNativeResizeMode:(NSString*)mode
{
  _nativeResizeMode = mode;
  [self _updateNativeResizeMode];
}

- (void)_updateNativeResizeMode
{
  if (_useNativeControls) {
    if (_playerViewController) {
      [_playerViewController setVideoGravity:_nativeResizeMode];
    }
    if (_fullscreenPlayerViewController) {
      [_fullscreenPlayerViewController setVideoGravity:_nativeResizeMode];
    }
  } else if (_playerLayer) {
    [_playerLayer setVideoGravity:_nativeResizeMode];
  }
}

- (void)setStatus:(NSDictionary *)status
{
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(_exAV.methodQueue, ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    [self setStatus:status resolver:nil rejecter:nil];
  });
}

- (NSDictionary *)getStatus
{
  if (_data) {
    return [_data getStatus];
  } else {
    return [ABI42_0_0EXAVPlayerData getUnloadedStatus];
  }
}

#pragma mark - ABI42_0_0React View Management

//- (void)insertABI42_0_0ReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
//{
//  // We are early in the game and somebody wants to set a subview.
//  // That can only be in the context of playerViewController.
//  if (!_useNativeControls && !_playerLayer && !_playerViewController) {
//    [self setUseNativeControls:YES];
//  }
//
//  if (_useNativeControls && _playerViewController) {
//    [super insertABI42_0_0ReactSubview:view atIndex:atIndex];
//    [view setFrame:self.bounds];
//    [_playerViewController.contentOverlayView insertSubview:view atIndex:atIndex];
//  } else {
//    ABI42_0_0RCTLogError(@"video cannot have any subviews");
//  }
//}

//- (void)removeABI42_0_0ReactSubview:(UIView *)subview
//{
//  if (_useNativeControls) {
//    [super removeABI42_0_0ReactSubview:subview];
//    [subview removeFromSuperview];
//  } else {
//    ABI42_0_0RCTLogError(@"video cannot have any subviews");
//  }
//}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_useNativeControls && _playerViewController) {
    [_playerViewController.view setFrame:self.bounds];
    
    // also adjust all subviews of contentOverlayView
    for (UIView* subview in _playerViewController.contentOverlayView.subviews) {
      [subview setFrame:self.bounds];
    }
  } else if (!_useNativeControls && _playerLayer) {
    [CATransaction begin];
    [CATransaction setAnimationDuration:0];
    [_playerLayer setFrame:self.bounds];
    [CATransaction commit];
  }
}

- (void)removeFromSuperview
{
  [self _removeData];
  [self _removePlayer];
  [super removeFromSuperview];
}

#pragma mark - ABI42_0_0EXVideoPlayerViewControllerDelegate

- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController
{
  if (_fullscreenPlayerViewController == playerViewController && _fullscreenPlayerPresented && !_fullscreenPlayerIsDismissing) {
    _fullscreenPlayerIsDismissing = YES;
    [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerWillDismiss];
  }
}

- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController
{
  if (_fullscreenPlayerViewController == playerViewController && _fullscreenPlayerPresented) {
    _fullscreenPlayerIsDismissing = NO;
    _fullscreenPlayerPresented = NO;
    _presentingViewController = nil;
    [self _removeFullscreenPlayerViewController];
    [self setUseNativeControls:_useNativeControls];
    [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerDidDismiss];
  }
}

#pragma mark - AVVideoPlayerViewControllerDelegate

- (void)playerViewController:(AVPlayerViewController *)playerViewController
willBeginFullScreenPresentationWithAnimationCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  if (playerViewController == _playerViewController) {
    _fullscreenPlayerPresented = YES;
    [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerWillPresent];
    [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerDidPresent];
  }
}

- (void)playerViewController:(AVPlayerViewController *)playerViewController
willEndFullScreenPresentationWithAnimationCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  if (playerViewController == _playerViewController) {
    _fullscreenPlayerPresented = NO;
    [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerWillDismiss];
    [self _callFullscreenCallbackForUpdate:ABI42_0_0EXVideoFullscreenUpdatePlayerDidDismiss];
  }
}

#pragma mark - ABI42_0_0EXAVObject

- (void)pauseImmediately
{
  if (_data) {
    [_data pauseImmediately];
  }
}

- (ABI42_0_0EXAVAudioSessionMode)getAudioSessionModeRequired
{
  return _data == nil ? ABI42_0_0EXAVAudioSessionModeInactive : [_data getAudioSessionModeRequired];
}

- (void)appDidForeground
{
  if (_data) {
    [_data appDidForeground];
  }
}

- (void)appDidBackground
{
  if (_data) {
    [_data appDidBackground];
  }
}

- (void)handleAudioSessionInterruption:(NSNotification*)notification
{
  if (_data) {
    [_data handleAudioSessionInterruption:notification];
  }
}

- (void)handleMediaServicesReset:(void (^)(void))finishCallback
{
  if (_data) {
    if (_onLoadStart) {
      _onLoadStart(nil);
    }
    [self _removePlayer];
    
    ABI42_0_0UM_WEAKIFY(self);
    [_data handleMediaServicesReset:^{
      ABI42_0_0UM_STRONGIFY(self);
      if (self) {
        [self _updateForNewPlayer];
      }
      if (finishCallback != nil) {
        finishCallback();
      }
    }];
  }
}

#pragma mark - NSObject Lifecycle

- (void)dealloc
{
  [_exAV unregisterVideoForAudioLifecycle:self];
  [_data pauseImmediately];
  [_exAV demoteAudioSessionIfPossible];
}

@end

