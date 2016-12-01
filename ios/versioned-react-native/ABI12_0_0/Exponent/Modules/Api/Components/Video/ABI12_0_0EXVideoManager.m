// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI12_0_0EXVideoManager.h"
#import "ABI12_0_0EXVideo.h"
#import "ABI12_0_0RCTBridge.h"
#import <AVFoundation/AVFoundation.h>

@implementation ABI12_0_0EXVideoManager

ABI12_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI12_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI12_0_0RCTDirectEventBlock);

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
