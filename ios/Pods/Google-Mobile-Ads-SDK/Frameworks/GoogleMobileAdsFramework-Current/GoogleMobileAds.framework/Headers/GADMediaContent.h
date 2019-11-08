//
//  GADMediaContent.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADVideoController.h>
#import <UIKit/UIKit.h>

/// Provides media content information. Interact with instances of this class on the main queue
/// only.
@interface GADMediaContent : NSObject

/// Controls the media content's video.
@property(nonatomic, readonly, nonnull) GADVideoController *videoController;

/// Indicates whether the media content has video content.
@property(nonatomic, readonly) BOOL hasVideoContent;

/// Media content aspect ratio (width/height). The value is 0 when there's no media content or the
/// media content aspect ratio is unknown.
@property(nonatomic, readonly) CGFloat aspectRatio;

/// The video's duration in seconds. Returns 0 if there is no video or the duration is unknown.
@property(nonatomic, readonly) NSTimeInterval duration;

/// The video's current playback time in seconds. Returns 0 if there's no video or the current
/// playback time is unknown.
@property(nonatomic, readonly) NSTimeInterval currentTime;

@end

@interface GADMediaContent (NativeAd)

/// The main image to be displayed when the media content doesn't contain video. Only available to
/// native ads.
@property(nonatomic, nullable) UIImage *mainImage;

@end
