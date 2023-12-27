// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>

#import <ABI43_0_0EXAV/ABI43_0_0EXAVObject.h>
#import <ABI43_0_0EXAV/ABI43_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI43_0_0EXVideoView : UIView <ABI43_0_0EXVideoPlayerViewControllerDelegate, AVPlayerViewControllerDelegate, ABI43_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI43_0_0EXVideoFullscreenUpdate)
{
  ABI43_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI43_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI43_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI43_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onLoad;
@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onError;
@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI43_0_0EXDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
             rejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

@end
