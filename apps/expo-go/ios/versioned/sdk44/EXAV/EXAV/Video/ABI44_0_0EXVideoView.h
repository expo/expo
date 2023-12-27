// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistry.h>

#import <ABI44_0_0EXAV/ABI44_0_0EXAVObject.h>
#import <ABI44_0_0EXAV/ABI44_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI44_0_0EXVideoView : UIView <ABI44_0_0EXVideoPlayerViewControllerDelegate, AVPlayerViewControllerDelegate, ABI44_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI44_0_0EXVideoFullscreenUpdate)
{
  ABI44_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI44_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI44_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI44_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onLoad;
@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onError;
@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI44_0_0EXDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
             rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

@end
