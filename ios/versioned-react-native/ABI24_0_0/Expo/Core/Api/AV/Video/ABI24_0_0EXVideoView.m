// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUtils.h>

#import "ABI24_0_0EXAV.h"
#import "ABI24_0_0EXVideoView.h"
#import "ABI24_0_0EXAVPlayerData.h"
#import "ABI24_0_0EXVideoPlayerViewController.h"

static NSString *const ABI24_0_0EXVideoReadyForDisplayKeyPath = @"readyForDisplay";

@interface ABI24_0_0EXVideoView ()

@property (nonatomic, weak) ABI24_0_0EXAV *exAV;

@property (nonatomic, strong) ABI24_0_0EXAVPlayerData *data;
@property (nonatomic, strong) AVPlayerLayer *playerLayer;
@property (nonatomic, strong) ABI24_0_0EXVideoPlayerViewController *playerViewController;

@property (nonatomic, strong) UIViewController *presentingViewController;
@property (nonatomic, assign) BOOL fullscreenPlayerPresented;

@property (nonatomic, strong) NSMutableDictionary *statusToSet;

@end

@implementation ABI24_0_0EXVideoView

#pragma mark - ABI24_0_0EXVideoView interface methods

- (instancetype)initWithBridge:(ABI24_0_0RCTBridge *)bridge
{
  if ((self = [super init])) {
    _exAV = [bridge moduleForClass:[ABI24_0_0EXAV class]];
    [_exAV registerVideoForAudioLifecycle:self];
    
    _data = nil;
    _playerLayer = nil;
    _playerViewController = nil;
    _presentingViewController = nil;
    _fullscreenPlayerPresented = NO;
    _statusToSet = [NSMutableDictionary new];
    _useNativeControls = NO;
    _nativeResizeMode = AVLayerVideoGravityResizeAspectFill;
  }
  
  return self;
}

#pragma mark - callback helper methods

- (void)_callFullscreenCallbackForUpdate:(ABI24_0_0EXVideoFullscreenUpdate)update
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

- (void)_tryUpdateDataStatus:(ABI24_0_0RCTPromiseResolveBlock)resolve
                    rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject
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
    resolve([ABI24_0_0EXAVPlayerData getUnloadedStatus]);
  }
}

- (void)_updateForNewPlayer
{
  [self setNativeResizeMode:_nativeResizeMode];
  [self setUseNativeControls:_useNativeControls];
  if (_onLoad) {
    _onLoad([self getStatus]);
  }
}

- (void)_removePlayer
{
  if (_data) {
    [_data pauseImmediately];
    _data.statusUpdateCallback = nil;
    [_exAV demoteAudioSessionIfPossible];
    [self _removePlayerLayer];
    [_playerViewController.view removeFromSuperview];
    _playerViewController = nil;
    _data = nil;
  }
}

#pragma mark - _playerViewController / _playerLayer management

- (ABI24_0_0EXVideoPlayerViewController *)_getNewPlayerViewController
{
  if (_data == nil) {
    return nil;
  }
  ABI24_0_0EXVideoPlayerViewController *controller = [[ABI24_0_0EXVideoPlayerViewController alloc] init];
  controller.showsPlaybackControls = _useNativeControls;
  controller.rctDelegate = self;
  controller.view.frame = self.bounds;
  controller.player = _data.player;
  return controller;
}

- (void)_usePlayerLayer
{
  if (_data) {
    _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_data.player];
    _playerLayer.frame = self.bounds;
    _playerLayer.needsDisplayOnBoundsChange = YES;
    
    // to prevent video from being animated when resizeMode is 'cover'
    // resize mode must be set before layer is added
    [self setNativeResizeMode:_nativeResizeMode];
    [_playerLayer addObserver:self forKeyPath:ABI24_0_0EXVideoReadyForDisplayKeyPath options:NSKeyValueObservingOptionNew context:nil];
    
    [self.layer addSublayer:_playerLayer];
    self.layer.needsDisplayOnBoundsChange = YES;
  }
}

- (void)_removePlayerLayer
{
  [_playerLayer removeFromSuperlayer];
  [_playerLayer removeObserver:self forKeyPath:ABI24_0_0EXVideoReadyForDisplayKeyPath];
  _playerLayer = nil;
}

#pragma mark - Observers

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if (object == _playerLayer && [keyPath isEqualToString:ABI24_0_0EXVideoReadyForDisplayKeyPath]) {
    if ([change objectForKey:NSKeyValueChangeNewKey] && _onReadyForDisplay) {
      // Calculate natural size of video:
      NSDictionary *naturalSize;
      
      if ([_data.player.currentItem.asset tracksWithMediaType:AVMediaTypeVideo].count > 0) {
        AVAssetTrack *videoTrack = [[_data.player.currentItem.asset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0];
        CGFloat width = videoTrack.naturalSize.width;
        CGFloat height = videoTrack.naturalSize.height;
        CGAffineTransform preferredTransform = [videoTrack preferredTransform];
        CGFloat tx = preferredTransform.tx;
        CGFloat ty = preferredTransform.ty;
        
        naturalSize = @{@"width": @(width),
                        @"height": @(height),
                        @"orientation": ((width == tx && height == ty) || (tx == 0 && ty == 0)) ? @"landscape" : @"portrait"};
      } else {
        naturalSize = nil;
      }
      
      if (naturalSize) {
        _onReadyForDisplay(@{@"naturalSize": naturalSize,
                             @"status": [_data getStatus]});
      }
    }
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

#pragma mark - Imperative API

- (void)setUri:(NSString *)uri
    withStatus:(NSDictionary *)initialStatus
      resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
      rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject
{
  if (_data) {
    [_statusToSet addEntriesFromDictionary:[_data getStatus]];
    [self _removePlayer];
  }
  
  if (initialStatus) {
    [_statusToSet addEntriesFromDictionary:initialStatus];
  }
  
  if (uri == nil) {
    if (resolve) {
      resolve([ABI24_0_0EXAVPlayerData getUnloadedStatus]);
    }
    return;
  }
  
  NSMutableDictionary *statusToInitiallySet = [NSMutableDictionary dictionaryWithDictionary:_statusToSet];
  [_statusToSet removeAllObjects];
  
  __weak __typeof__(self) weakSelf = self;
  
  void (^statusUpdateCallback)(NSDictionary *) = ^(NSDictionary *status) {
    __strong __typeof__(self) strongSelf = weakSelf;
    if (strongSelf && strongSelf.onStatusUpdate) {
      strongSelf.onStatusUpdate(status);
    }
  };
  
  void (^errorCallback)(NSString *) = ^(NSString *error) {
    __strong __typeof__(self) strongSelf = weakSelf;
    if (strongSelf) {
      [strongSelf _removePlayer];
      [strongSelf _callErrorCallback:error];
    }
  };
  
  _data = [[ABI24_0_0EXAVPlayerData alloc] initWithEXAV:_exAV
                                       withURL:[NSURL URLWithString:uri]
                                    withStatus:statusToInitiallySet
                          withLoadFinishBlock:^(BOOL success, NSDictionary *successStatus, NSString *error) {
                            if (success) {
                              [weakSelf _updateForNewPlayer];
                              if (resolve) {
                                resolve(successStatus);
                              }
                            } else {
                              [self _removePlayer];
                              if (reject) {
                                reject(@"E_VIDEO_NOTCREATED", nil, ABI24_0_0RCTErrorWithMessage(error));
                              }
                              [weakSelf _callErrorCallback:error];
                            }
                          }];
  _data.statusUpdateCallback = statusUpdateCallback;
  _data.errorCallback = errorCallback;
  
  // Call onLoadStart on next run loop, otherwise it might not be set yet (if it is set at the same time as uri, via props)
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t) 0), dispatch_get_main_queue(), ^{
    if (weakSelf.onLoadStart) {
      weakSelf.onLoadStart(nil);
    }
  });
}

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject
{
  if (status != nil) {
    [_statusToSet addEntriesFromDictionary:status];
  }
  [self _tryUpdateDataStatus:resolve rejecter:reject];
}

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
                rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject
{
  if (status != nil) {
    [_statusToSet addEntriesFromDictionary:status];
  }
  
  NSMutableDictionary *newStatus = [NSMutableDictionary dictionaryWithDictionary:_statusToSet];
  [_statusToSet removeAllObjects];
  
  [_data replayWithStatus:newStatus resolver:resolve rejecter:reject];
}

- (void)setFullscreen:(BOOL)value
             resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
             rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject
{
  if (!_data) {
    // We have no video. TODO what about when video is mid-load?
    if (reject) {
      reject(@"E_VIDEO_FULLSCREEN", nil, ABI24_0_0RCTErrorWithMessage(@"Fullscreen encountered an error: video is not loaded."));
    }
    return;
  }
  
  // TODO test race condition of calling this twice in rapid succession
  
  __weak __typeof__(self) weakSelf = self;
  if (value && !_fullscreenPlayerPresented) {
    if (_useNativeControls || _playerViewController != nil) {
      [_playerViewController.view removeFromSuperview];
      _playerViewController = nil;
      [self _usePlayerLayer];
    }
    _playerViewController = [self _getNewPlayerViewController];
    
    // to prevent video from being animated when resizeMode is 'cover'
    // resize mode must be set before subview is added
    [self setNativeResizeMode:_nativeResizeMode];
    
    // Set presentation style to fullscreen
    [_playerViewController setModalPresentationStyle:UIModalPresentationFullScreen];
    
    // Find the nearest view controller
    _presentingViewController = ABI24_0_0RCTPresentedViewController();
    [self _callFullscreenCallbackForUpdate:ABI24_0_0EXVideoFullscreenUpdatePlayerWillPresent];
    
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf.presentingViewController presentViewController:weakSelf.playerViewController animated:YES completion:^{
        weakSelf.playerViewController.showsPlaybackControls = YES;
        weakSelf.fullscreenPlayerPresented = YES;
        [weakSelf _callFullscreenCallbackForUpdate:ABI24_0_0EXVideoFullscreenUpdatePlayerDidPresent];
        if (resolve) {
          resolve([weakSelf getStatus]);
        }
      }];
    });
  } else if (!value && _fullscreenPlayerPresented) {
    [self videoPlayerViewControllerWillDismiss:_playerViewController];
    
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf.presentingViewController dismissViewControllerAnimated:YES completion:^{
        [weakSelf videoPlayerViewControllerDidDismiss:weakSelf.playerViewController]; // TODO does this fire twice?
        if (resolve) {
          resolve([weakSelf getStatus]);
        }
      }];
    });
  } else if (resolve) { // Fullscreen is already appropriately set.
    resolve([self getStatus]);
  }
}

#pragma mark - Prop setters

- (void)setUri:(NSString *)uri
{
  [self setUri:uri withStatus:nil resolver:nil rejecter:nil];
}

- (NSString *)getUri
{
  return _data != nil ? _data.url.absoluteString : @"";
}

- (void)setUseNativeControls:(BOOL)useNativeControls
{
  _useNativeControls = useNativeControls;
  if (_data == nil) {
    return;
  }
  
  dispatch_async(dispatch_get_main_queue(), ^{
    if (_useNativeControls) {
      if (_playerLayer) {
        [self _removePlayerLayer];
      }
      if (!_playerViewController && _data) {
        _playerViewController = [self _getNewPlayerViewController];
        // to prevent video from being animated when resizeMode is 'cover'
        // resize mode must be set before subview is added
        [self setNativeResizeMode:_nativeResizeMode];
        [self addSubview:_playerViewController.view];
      }
    } else {
      if (_playerViewController) {
        [_playerViewController.view removeFromSuperview];
        _playerViewController = nil;
      }
      if (!_playerLayer) {
        [self _usePlayerLayer];
      }
    }
  });
}

- (void)setNativeResizeMode:(NSString*)mode
{
  _nativeResizeMode = mode;
  if (_useNativeControls) {
    if (_playerViewController) {
      _playerViewController.videoGravity = mode;
    }
  } else if (_playerLayer) {
    _playerLayer.videoGravity = mode;
  }
}

- (void)setStatus:(NSDictionary *)status
{
  [self setStatus:status resolver:nil rejecter:nil];
}

- (NSDictionary *)getStatus
{
  if (_data) {
    return [_data getStatus];
  } else {
    return [ABI24_0_0EXAVPlayerData getUnloadedStatus];
  }
}

#pragma mark - ReactABI24_0_0 View Management

- (void)insertReactABI24_0_0Subview:(UIView *)view atIndex:(NSInteger)atIndex
{
  // We are early in the game and somebody wants to set a subview.
  // That can only be in the context of playerViewController.
  if (!_useNativeControls && !_playerLayer && !_playerViewController) {
    [self setUseNativeControls:YES];
  }
  
  if (_useNativeControls && _playerViewController) {
    [super insertReactABI24_0_0Subview:view atIndex:atIndex];
    view.frame = self.bounds;
    [_playerViewController.contentOverlayView insertSubview:view atIndex:atIndex];
  } else {
    ABI24_0_0RCTLogError(@"video cannot have any subviews");
  }
  return;
}

- (void)removeReactABI24_0_0Subview:(UIView *)subview
{
  if (_useNativeControls) {
    [super removeReactABI24_0_0Subview:subview];
    [subview removeFromSuperview];
  } else {
    ABI24_0_0RCTLogError(@"video cannot have any subviews");
  }
  return;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_useNativeControls && _playerViewController) {
    _playerViewController.view.frame = self.bounds;
    
    // also adjust all subviews of contentOverlayView
    for (UIView* subview in _playerViewController.contentOverlayView.subviews) {
      subview.frame = self.bounds;
    }
  } else if (!_useNativeControls && _playerLayer) {
    [CATransaction begin];
    [CATransaction setAnimationDuration:0];
    _playerLayer.frame = self.bounds;
    [CATransaction commit];
  }
}

- (void)removeFromSuperview
{
  [self _removePlayer];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [super removeFromSuperview];
}

#pragma mark - ABI24_0_0EXVideoPlayerViewControllerDelegate

- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController
{
  if (_playerViewController == playerViewController && _fullscreenPlayerPresented) {
    [self _callFullscreenCallbackForUpdate:ABI24_0_0EXVideoFullscreenUpdatePlayerWillDismiss];
  }
}

- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController
{
  if (_playerViewController == playerViewController && _fullscreenPlayerPresented) {
    _fullscreenPlayerPresented = false;
    _presentingViewController = nil;
    _playerViewController = nil;
    [self setUseNativeControls:_useNativeControls];
    [self _callFullscreenCallbackForUpdate:ABI24_0_0EXVideoFullscreenUpdatePlayerDidDismiss];
  }
}

#pragma mark - ABI24_0_0EXAVObject

- (void)pauseImmediately
{
  if (_data) {
    [_data pauseImmediately];
  }
}

- (ABI24_0_0EXAVAudioSessionMode)getAudioSessionModeRequired
{
  return _data == nil ? ABI24_0_0EXAVAudioSessionModeInactive : [_data getAudioSessionModeRequired];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if (_data) {
    [_data bridgeDidForeground:notification];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  if (_data) {
    [_data bridgeDidForeground:notification];
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
    [self _removePlayerLayer];
    [_playerViewController.view removeFromSuperview];
    _playerViewController = nil;
    
    __weak __typeof__(self) weakSelf = self;
    [_data handleMediaServicesReset:^{
      [weakSelf _updateForNewPlayer];
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
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_data pauseImmediately];
  [_exAV demoteAudioSessionIfPossible];
}

@end
