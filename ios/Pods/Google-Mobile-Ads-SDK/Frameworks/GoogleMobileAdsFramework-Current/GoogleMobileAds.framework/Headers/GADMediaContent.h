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

/// Media content aspect ratio (width/height). The value is 0 when there's no media content or the
/// media content aspect ratio is unknown.
@property(nonatomic, readonly) CGFloat aspectRatio;

/// The main image to be displayed when the media content doesn't contain video.
@property(nonatomic, nullable) UIImage *mainImage;

/// Controls the media content's video.
@property(nonatomic, readonly, nonnull) GADVideoController *videoController;

/// Indicates whether the media content has video content.
@property(nonatomic, readonly) BOOL hasVideoContent;

@end
