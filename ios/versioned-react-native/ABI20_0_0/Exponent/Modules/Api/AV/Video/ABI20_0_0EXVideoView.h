// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI20_0_0/ABI20_0_0RCTComponent.h>

#import "ABI20_0_0EXAVObject.h"
#import "ABI20_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI20_0_0RCTEventDispatcher;

@interface ABI20_0_0EXVideoView : UIView <ABI20_0_0EXVideoPlayerViewControllerDelegate, ABI20_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI20_0_0EXVideoFullscreenUpdate)
{
  ABI20_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI20_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI20_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI20_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus, setter=setStatus:) NSDictionary *status;
@property (nonatomic, strong, getter=getUri, setter=setUri:) NSString *uri;
@property (nonatomic, assign, setter=setUseNativeControls:) BOOL useNativeControls;
@property (nonatomic, strong, setter=setNativeResizeMode:) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onLoad;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onError;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithBridge:(ABI20_0_0RCTBridge *)bridge;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject;

- (void)setUri:(NSString *)uri
    withStatus:(NSDictionary *)initialStatus
      resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
      rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
             rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject;

@end
