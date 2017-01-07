// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI13_0_0EXVideoManager.h"
#import "ABI13_0_0EXVideo.h"
#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>

@implementation ABI13_0_0EXVideoManager

ABI13_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI13_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI13_0_0RCTDirectEventBlock);

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
