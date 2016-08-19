// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXVideoManager.h"
#import "ABI9_0_0EXVideo.h"
#import "ABI9_0_0RCTBridge.h"
#import <AVFoundation/AVFoundation.h>

@implementation ABI9_0_0EXVideoManager

ABI9_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI9_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI9_0_0RCTDirectEventBlock);
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI9_0_0RCTDirectEventBlock);

- (NSDictionary *)constantsToExport
{
  return @{
           @"ScaleNone": AVLayerVideoGravityResizeAspect,
           @"ScaleToFill": AVLayerVideoGravityResize,
           @"ScaleAspectFit": AVLayerVideoGravityResizeAspect,
           @"ScaleAspectFill": AVLayerVideoGravityResizeAspectFill
           };
}

@end
