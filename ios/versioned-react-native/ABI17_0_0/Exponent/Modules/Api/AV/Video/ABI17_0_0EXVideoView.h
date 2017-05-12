// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0RCTComponent.h"

#import "ABI17_0_0EXAVObject.h"
#import "ABI17_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI17_0_0RCTEventDispatcher;

@interface ABI17_0_0EXVideoView : UIView <ABI17_0_0EXVideoPlayerViewControllerDelegate, ABI17_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI17_0_0EXVideoFullscreenUpdate)
{
  ABI17_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI17_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI17_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI17_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus, setter=setStatus:) NSDictionary *status;
@property (nonatomic, strong, getter=getUri, setter=setUri:) NSString *uri;
@property (nonatomic, assign, setter=setUseNativeControls:) BOOL useNativeControls;
@property (nonatomic, strong, setter=setNativeResizeMode:) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI17_0_0RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI17_0_0RCTDirectEventBlock onLoad;
@property (nonatomic, copy) ABI17_0_0RCTDirectEventBlock onError;
@property (nonatomic, copy) ABI17_0_0RCTDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI17_0_0RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI17_0_0RCTDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithBridge:(ABI17_0_0RCTBridge *)bridge;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject;

- (void)setUri:(NSString *)uri
    withStatus:(NSDictionary *)initialStatus
      resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
      rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
             rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject;

@end
