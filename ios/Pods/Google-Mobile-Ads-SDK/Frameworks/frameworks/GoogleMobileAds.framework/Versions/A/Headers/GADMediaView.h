//
//  GADMediaView.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADNativeAd.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Displays native ad media assets.
///
/// To display media assets in GADNativeAppInstallAdView instances, add a GADMediaView subview and
/// assign the native ad view's mediaView property.
///
/// If the native ad doesn't contain a video and image loading is enabled, the GADMediaView displays
/// the native ad's |images| asset's first image.
///
/// If the native ad doesn't contain a video and image loading is disabled, the GADMediaView object
/// is empty.
@interface GADMediaView : UIView

/// The associated native ad. Setting this property displays the native ad's media assets in this
/// view.
@property(nonatomic, weak) GADNativeAd *nativeAd;

@end

GAD_ASSUME_NONNULL_END
