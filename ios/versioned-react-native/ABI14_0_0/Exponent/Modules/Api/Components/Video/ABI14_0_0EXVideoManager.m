// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI14_0_0EXVideoManager.h"
#import "ABI14_0_0EXVideo.h"
#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>

@implementation ABI14_0_0EXVideoManager

ABI14_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI14_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI14_0_0RCTDirectEventBlock);

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
