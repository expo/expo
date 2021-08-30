// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistry.h>

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
@property (nonatomic, copy) EXDirectEventBlock onLoadStart;
@property (nonatomic, copy) EXDirectEventBlock onLoad;
@property (nonatomic, copy) EXDirectEventBlock onError;
@property (nonatomic, copy) EXDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) EXDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) EXDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;

- (void)setStatus:(NSDictionary *)status
         resolver:(EXPromiseResolveBlock)resolve
         rejecter:(EXPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(EXPromiseResolveBlock)resolve
                rejecter:(EXPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(EXPromiseResolveBlock)resolve
         rejecter:(EXPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(EXPromiseResolveBlock)resolve
             rejecter:(EXPromiseRejectBlock)reject;

@end
