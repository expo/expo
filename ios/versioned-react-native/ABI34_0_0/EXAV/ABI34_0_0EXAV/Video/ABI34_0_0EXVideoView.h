// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistry.h>

#import <ABI34_0_0EXAV/ABI34_0_0EXAVObject.h>
#import <ABI34_0_0EXAV/ABI34_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI34_0_0EXVideoView : UIView <ABI34_0_0EXVideoPlayerViewControllerDelegate, ABI34_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI34_0_0EXVideoFullscreenUpdate)
{
  ABI34_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI34_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI34_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI34_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onLoad;
@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onError;
@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI34_0_0UMDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
         rejecter:(ABI34_0_0UMPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                rejecter:(ABI34_0_0UMPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
         rejecter:(ABI34_0_0UMPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
             rejecter:(ABI34_0_0UMPromiseRejectBlock)reject;

@end
