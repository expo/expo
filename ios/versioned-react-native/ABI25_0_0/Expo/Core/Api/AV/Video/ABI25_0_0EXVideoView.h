// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI25_0_0/ABI25_0_0RCTComponent.h>

#import "ABI25_0_0EXAVObject.h"
#import "ABI25_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI25_0_0RCTEventDispatcher;

@interface ABI25_0_0EXVideoView : UIView <ABI25_0_0EXVideoPlayerViewControllerDelegate, ABI25_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI25_0_0EXVideoFullscreenUpdate)
{
  ABI25_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI25_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI25_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI25_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onLoad;
@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onError;
@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithBridge:(ABI25_0_0RCTBridge *)bridge;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
             rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;

@end
