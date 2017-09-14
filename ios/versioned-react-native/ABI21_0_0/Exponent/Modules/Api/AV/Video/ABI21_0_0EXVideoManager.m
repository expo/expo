// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUtils.h>

#import "ABI21_0_0EXVideoManager.h"
#import "ABI21_0_0EXVideoView.h"

@implementation ABI21_0_0EXVideoManager

ABI21_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI21_0_0EXVideoView alloc] initWithBridge:_bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

// Props set directly in <Video> component
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(status, NSDictionary);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(useNativeControls, BOOL);

// Native only props -- set by Video.js
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(uri, NSString);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(nativeResizeMode, NSString);
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onStatusUpdateNative, onStatusUpdate, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onLoadStartNative, onLoadStart, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onLoadNative, onLoad, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onErrorNative, onError, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onReadyForDisplayNative, onReadyForDisplay, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(onFullscreenUpdateNative, onFullscreenUpdate, ABI21_0_0RCTDirectEventBlock);

- (void)_runBlock:(void (^)(ABI21_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)ReactABI21_0_0Tag
     withRejecter:(ABI21_0_0RCTPromiseRejectBlock)reject
{
  [_bridge.uiManager addUIBlock:^(ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI21_0_0Tag];
    if ([view isKindOfClass:[ABI21_0_0EXVideoView class]]) {
      block((ABI21_0_0EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI21_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, ABI21_0_0RCTErrorWithMessage(errorMessage));
    }
  }];
}

ABI21_0_0RCT_EXPORT_METHOD(setFullscreen:(nonnull NSNumber *)ReactABI21_0_0Tag
                  toValue:(BOOL)value
                  resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI21_0_0EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI21_0_0Tag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
