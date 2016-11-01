// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0EXVideoManager.h"
#import "ABI11_0_0EXVideo.h"
#import "ABI11_0_0RCTBridge.h"
#import <AVFoundation/AVFoundation.h>

@implementation ABI11_0_0EXVideoManager

ABI11_0_0RCT_EXPORT_MODULE(ExponentVideoManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI11_0_0EXVideo alloc] initWithBridge:_bridge];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(src, NSDictionary);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(paused, BOOL);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(muted, BOOL);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(controls, BOOL);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(volume, float);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(rate, float);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(seek, float);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(currentTime, float);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoadStart, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoError, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoProgress, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoSeek, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoEnd, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillPresent, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidPresent, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerWillDismiss, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onVideoFullscreenPlayerDidDismiss, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onReadyForDisplay, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackStalled, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackResume, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onPlaybackRateChange, ABI11_0_0RCTDirectEventBlock);

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
