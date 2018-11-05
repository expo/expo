// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>

#import "ABI28_0_0EXVideoManager.h"
#import "ABI28_0_0EXVideoView.h"

@implementation ABI28_0_0EXVideoManager

ABI28_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI28_0_0EXVideoView alloc] initWithBridge:_bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

// Props set directly in <Video> component
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(status, NSDictionary);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(useNativeControls, BOOL);

// Native only props -- set by Video.js
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(nativeResizeMode, NSString);
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onStatusUpdateNative, onStatusUpdate, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onLoadStartNative, onLoadStart, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onLoadNative, onLoad, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onErrorNative, onError, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onReadyForDisplayNative, onReadyForDisplay, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onFullscreenUpdateNative, onFullscreenUpdate, ABI28_0_0RCTDirectEventBlock);

- (void)_runBlock:(void (^)(ABI28_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)ReactABI28_0_0Tag
     withRejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
{
  [_bridge.uiManager addUIBlock:^(ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI28_0_0Tag];
    if ([view isKindOfClass:[ABI28_0_0EXVideoView class]]) {
      block((ABI28_0_0EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI28_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, ABI28_0_0RCTErrorWithMessage(errorMessage));
    }
  }];
}

ABI28_0_0RCT_EXPORT_METHOD(setFullscreen:(nonnull NSNumber *)ReactABI28_0_0Tag
                  toValue:(BOOL)value
                  resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI28_0_0EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI28_0_0Tag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
