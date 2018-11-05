//
//  GADVideoController.h
//  Google Mobile Ads SDK
//
//  Copyright (c) 2016 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

@protocol GADVideoControllerDelegate;

/// The video controller class provides a way to get the video metadata and also manages video
/// content of the ad rendered by the Google Mobile Ads SDK. You don't need to create an instance of
/// this class. When the ad rendered by the Google Mobile Ads SDK loads video content, you may be
/// able to get an instance of this class from the rendered ad object. Currently only native express
/// ad view class exposes video controller.
@interface GADVideoController : NSObject

/// Delegate for receiving video notifications.
@property(nonatomic, weak, GAD_NULLABLE) id<GADVideoControllerDelegate> delegate;

/// Mute or unmute video. Set to YES to mute the video. Set to NO to allow the video to play sound.
- (void)setMute:(BOOL)mute;

/// Play the video. Doesn't do anything if the video is already playing.
- (void)play;

/// Pause the video. Doesn't do anything if the video is already paused.
- (void)pause;

/// Returns a Boolean indicating if the receiver has video content.
- (BOOL)hasVideoContent;

/// Returns the video's aspect ratio (width/height) or 0 if no video is present.
- (double)aspectRatio;

/// Indicates if video custom controls (i.e. play/pause/mute/unmute) are enabled.
- (BOOL)customControlsEnabled;

@end

GAD_ASSUME_NONNULL_END
