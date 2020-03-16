// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>

#import <ABI37_0_0EXAV/ABI37_0_0EXAVObject.h>
#import <ABI37_0_0EXAV/ABI37_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI37_0_0EXVideoView : UIView <ABI37_0_0EXVideoPlayerViewControllerDelegate, ABI37_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI37_0_0EXVideoFullscreenUpdate)
{
  ABI37_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI37_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI37_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI37_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onLoad;
@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onError;
@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI37_0_0UMDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
         rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
         rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
             rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

@end
