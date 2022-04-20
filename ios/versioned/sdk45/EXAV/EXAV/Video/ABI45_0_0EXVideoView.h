// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistry.h>

#import <ABI45_0_0EXAV/ABI45_0_0EXAVObject.h>
#import <ABI45_0_0EXAV/ABI45_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI45_0_0EXVideoView : UIView <ABI45_0_0EXVideoPlayerViewControllerDelegate, AVPlayerViewControllerDelegate, ABI45_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI45_0_0EXVideoFullscreenUpdate)
{
  ABI45_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI45_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI45_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI45_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onLoad;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onError;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI45_0_0EXDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
             rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;

- (void)setStatusFromPlaybackAPI:(NSDictionary *)status
                        resolver:(ABI45_0_0EXPromiseResolveBlock)resolve
                        rejecter:(ABI45_0_0EXPromiseRejectBlock)reject;

@end
