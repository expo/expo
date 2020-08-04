// Copyright 2015-present 650 Industries. All rights reserved.

#import <UMCore/UMModuleRegistry.h>

#import <EXAV/EXAVObject.h>
#import <EXAV/EXVideoPlayerViewControllerDelegate.h>

@interface EXVideoView : UIView <EXVideoPlayerViewControllerDelegate, AVPlayerViewControllerDelegate, EXAVObject>

typedef NS_OPTIONS(NSUInteger, EXVideoFullscreenUpdate)
{
  EXVideoFullscreenUpdatePlayerWillPresent = 0,
  EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) UMDirectEventBlock onLoadStart;
@property (nonatomic, copy) UMDirectEventBlock onLoad;
@property (nonatomic, copy) UMDirectEventBlock onError;
@property (nonatomic, copy) UMDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) UMDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) UMDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;

- (void)setStatus:(NSDictionary *)status
         resolver:(UMPromiseResolveBlock)resolve
         rejecter:(UMPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(UMPromiseResolveBlock)resolve
                rejecter:(UMPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(UMPromiseResolveBlock)resolve
         rejecter:(UMPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(UMPromiseResolveBlock)resolve
             rejecter:(UMPromiseRejectBlock)reject;

@end
