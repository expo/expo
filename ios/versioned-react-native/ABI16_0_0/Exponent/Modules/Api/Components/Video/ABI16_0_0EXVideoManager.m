// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI16_0_0EXVideoManager.h"
#import "ABI16_0_0EXVideo.h"
#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>

@implementation ABI16_0_0EXVideoManager

ABI16_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI16_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI16_0_0RCTDirectEventBlock);

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
