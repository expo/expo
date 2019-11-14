//
//  GADVideoControllerDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// The GADVideoControllerDelegate protocol defines methods that are called by the video controller
/// object in response to the video events that occurred throughout the lifetime of the video
/// rendered by an ad.
@protocol GADVideoControllerDelegate <NSObject>

@optional

/// Tells the delegate that the video controller has began or resumed playing a video.
- (void)videoControllerDidPlayVideo:(nonnull GADVideoController *)videoController;

/// Tells the delegate that the video controller has paused video.
- (void)videoControllerDidPauseVideo:(nonnull GADVideoController *)videoController;

/// Tells the delegate that the video controller's video playback has ended.
- (void)videoControllerDidEndVideoPlayback:(nonnull GADVideoController *)videoController;

/// Tells the delegate that the video controller has muted video.
- (void)videoControllerDidMuteVideo:(nonnull GADVideoController *)videoController;

/// Tells the delegate that the video controller has unmuted video.
- (void)videoControllerDidUnmuteVideo:(nonnull GADVideoController *)videoController;

@end
