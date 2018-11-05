//
//  GADVideoControllerDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright (c) 2016 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// The GADVideoControllerDelegate protocol defines methods that are called by the video controller
/// object in response to the video events that occured throught the lifetime of the video rendered
/// by an ad.
@protocol GADVideoControllerDelegate<NSObject>

@optional

/// Tells the delegate that the video controller has began or resumed playing a video.
- (void)videoControllerDidPlayVideo:(GADVideoController *)videoController;

/// Tells the delegate that the video controller has paused video.
- (void)videoControllerDidPauseVideo:(GADVideoController *)videoController;

/// Tells the delegate that the video controller's video playback has ended.
- (void)videoControllerDidEndVideoPlayback:(GADVideoController *)videoController;

/// Tells the delegate that the video controller has muted video.
- (void)videoControllerDidMuteVideo:(GADVideoController *)videoController;

/// Tells the delegate that the video controller has unmuted video.
- (void)videoControllerDidUnmuteVideo:(GADVideoController *)videoController;

@end

GAD_ASSUME_NONNULL_END
