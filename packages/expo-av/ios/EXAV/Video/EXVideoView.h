// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTComponent.h>

#import "EXAVObject.h"
#import "EXVideoPlayerViewControllerDelegate.h"

@class RCTEventDispatcher;

@interface EXVideoView : UIView <EXVideoPlayerViewControllerDelegate, EXAVObject>

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
@property (nonatomic, copy) RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;
@property (nonatomic, copy) RCTDirectEventBlock onError;
@property (nonatomic, copy) RCTDirectEventBlock onStatusUpdate;
@property (nonatomic, copy) RCTDirectEventBlock onReadyForDisplay;
@property (nonatomic, copy) RCTDirectEventBlock onFullscreenUpdate;

- (instancetype)initWithBridge:(RCTBridge *)bridge;

- (void)setStatus:(NSDictionary *)status
         resolver:(RCTPromiseResolveBlock)resolve
         rejecter:(RCTPromiseRejectBlock)reject;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(RCTPromiseResolveBlock)resolve
                rejecter:(RCTPromiseRejectBlock)reject;

- (void)setSource:(NSDictionary *)source
       withStatus:(NSDictionary *)initialStatus
         resolver:(RCTPromiseResolveBlock)resolve
         rejecter:(RCTPromiseRejectBlock)reject;

- (void)setFullscreen:(BOOL)value
             resolver:(RCTPromiseResolveBlock)resolve
             rejecter:(RCTPromiseRejectBlock)reject;

@end
