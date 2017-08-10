// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>

#import "ABI20_0_0EXVideoManager.h"
#import "ABI20_0_0EXVideoView.h"

@implementation ABI20_0_0EXVideoManager

ABI20_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI20_0_0EXVideoView alloc] initWithBridge:_bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

// Props set directly in <Video> component
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(status, NSDictionary);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(useNativeControls, BOOL);

// Native only props -- set by Video.js
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(uri, NSString);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(nativeResizeMode, NSString);
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(onStatusUpdateNative, onStatusUpdate, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(onLoadStartNative, onLoadStart, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(onLoadNative, onLoad, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(onErrorNative, onError, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(onReadyForDisplayNative, onReadyForDisplay, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(onFullscreenUpdateNative, onFullscreenUpdate, ABI20_0_0RCTDirectEventBlock);

- (void)_runBlock:(void (^)(ABI20_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)ReactABI20_0_0Tag
     withRejecter:(ABI20_0_0RCTPromiseRejectBlock)reject
{
  [_bridge.uiManager addUIBlock:^(ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI20_0_0Tag];
    if ([view isKindOfClass:[ABI20_0_0EXVideoView class]]) {
      block((ABI20_0_0EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI20_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, ABI20_0_0RCTErrorWithMessage(errorMessage));
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(setFullscreen:(nonnull NSNumber *)ReactABI20_0_0Tag
                  toValue:(BOOL)value
                  resolver:(ABI20_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI20_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI20_0_0EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI20_0_0Tag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
