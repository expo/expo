// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUIManager.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

#import "ABI17_0_0EXVideoManager.h"
#import "ABI17_0_0EXVideoView.h"

@implementation ABI17_0_0EXVideoManager

ABI17_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI17_0_0EXVideoView alloc] initWithBridge:_bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

// Props set directly in <Video> component
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(status, NSDictionary);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(useNativeControls, BOOL);

// Native only props -- set by Video.js
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(uri, NSString);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(nativeResizeMode, NSString);
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(onStatusUpdateNative, onStatusUpdate, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(onLoadStartNative, onLoadStart, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(onLoadNative, onLoad, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(onErrorNative, onError, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(onReadyForDisplayNative, onReadyForDisplay, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(onFullscreenUpdateNative, onFullscreenUpdate, ABI17_0_0RCTDirectEventBlock);

- (void)_runBlock:(void (^)(ABI17_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)ReactABI17_0_0Tag
     withRejecter:(ABI17_0_0RCTPromiseRejectBlock)reject
{
  [_bridge.uiManager addUIBlock:^(ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[ReactABI17_0_0Tag];
    if ([view isKindOfClass:[ABI17_0_0EXVideoView class]]) {
      block((ABI17_0_0EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI17_0_0EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, ABI17_0_0RCTErrorWithMessage(errorMessage));
    }
  }];
}

ABI17_0_0RCT_EXPORT_METHOD(setFullscreen:(nonnull NSNumber *)ReactABI17_0_0Tag
                  toValue:(BOOL)value
                  resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI17_0_0EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:ReactABI17_0_0Tag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
