// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI28_0_0/ABI28_0_0RCTComponent.h>

#import "ABI28_0_0EXAVObject.h"
#import "ABI28_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI28_0_0RCTEventDispatcher;

@interface ABI28_0_0EXVideoView : UIView <ABI28_0_0EXVideoPlayerViewControllerDelegate, ABI28_0_0EXAVObject>

typedef NS_OPTIONS(NSUInteger, ABI28_0_0EXVideoFullscreenUpdate)
{
  ABI28_0_0EXVideoFullscreenUpdatePlayerWillPresent = 0,
  ABI28_0_0EXVideoFullscreenUpdatePlayerDidPresent  = 1,
  ABI28_0_0EXVideoFullscreenUpdatePlayerWillDismiss = 2,
  ABI28_0_0EXVideoFullscreenUpdatePlayerDidDismiss  = 3,
};

@property (nonatomic, strong, getter=getStatus) NSDictionary *status;
@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) BOOL useNativeControls;
@property (nonatomic, strong) NSString *nativeResizeMode;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onLoad;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onError;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) ABI28_0_0RCTDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithBridge:(ABI28_0_0RCTBridge *)bridge;

- (void)setStatus:(NSDictionary *)status
         resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
             rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject;

@end
