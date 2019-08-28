//
//  GADMediaView.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADMediaContent.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// Displays native ad media content.
///
/// To display media content in GADUnifiedNativeAdView instances, add a GADMediaView subview,
/// assign the native ad view's mediaView property, and set the native ad's mediaContent property to
/// the media view.
///
/// If the native ad contains video content, the media view displays the video content.
///
/// If the native ad doesn't have video content and image loading is enabled, the media view
/// displays the first image from the native ad's |images| property.
///
/// If the native ad doesn't have video content and image loading is disabled, the media view is
/// empty.
@interface GADMediaView : UIView

/// The media content displayed in the media view.
@property(nonatomic, nullable) GADMediaContent *mediaContent;

@end

NS_ASSUME_NONNULL_END
