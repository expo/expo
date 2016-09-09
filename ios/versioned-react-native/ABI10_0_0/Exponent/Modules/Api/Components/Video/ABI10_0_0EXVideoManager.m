// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0EXVideoManager.h"
#import "ABI10_0_0EXVideo.h"
#import "ABI10_0_0RCTBridge.h"
#import <AVFoundation/AVFoundation.h>

@implementation ABI10_0_0EXVideoManager

ABI10_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI10_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI10_0_0RCTDirectEventBlock);

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
