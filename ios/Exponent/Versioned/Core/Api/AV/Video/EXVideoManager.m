// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

#import "EXVideoManager.h"
#import "EXVideoView.h"

@implementation EXVideoManager

RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[EXVideoView alloc] initWithBridge:_bridge];
}

- (NSDictionary *)constantsToExport
{
  return @{@"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill};
}

// Props set directly in <Video> component
RCT_EXPORT_VIEW_PROPERTY(status, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(useNativeControls, BOOL);

// Native only props -- set by Video.js
RCT_EXPORT_VIEW_PROPERTY(uri, NSString);
RCT_EXPORT_VIEW_PROPERTY(nativeResizeMode, NSString);
RCT_REMAP_VIEW_PROPERTY(onStatusUpdateNative, onStatusUpdate, RCTDirectEventBlock);
RCT_REMAP_VIEW_PROPERTY(onLoadStartNative, onLoadStart, RCTDirectEventBlock);
RCT_REMAP_VIEW_PROPERTY(onLoadNative, onLoad, RCTDirectEventBlock);
RCT_REMAP_VIEW_PROPERTY(onErrorNative, onError, RCTDirectEventBlock);
RCT_REMAP_VIEW_PROPERTY(onReadyForDisplayNative, onReadyForDisplay, RCTDirectEventBlock);
RCT_REMAP_VIEW_PROPERTY(onFullscreenUpdateNative, onFullscreenUpdate, RCTDirectEventBlock);

- (void)_runBlock:(void (^)(EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)reactTag
     withRejecter:(RCTPromiseRejectBlock)reject
{
  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if ([view isKindOfClass:[EXVideoView class]]) {
      block((EXVideoView *)view);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, RCTErrorWithMessage(errorMessage));
    }
  }];
}

RCT_EXPORT_METHOD(setFullscreen:(nonnull NSNumber *)reactTag
                  toValue:(BOOL)value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    [view setFullscreen:value resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

// Note that the imperative playback API for Video is conducted through the AV module.

@end
