// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI15_0_0EXVideoManager.h"
#import "ABI15_0_0EXVideo.h"
#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>

@implementation ABI15_0_0EXVideoManager

ABI15_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI15_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI15_0_0RCTDirectEventBlock);

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
