//
//  DFPBannerViewOptions.h
//  Google Mobile Ads SDK
//
//  Copyright © 2016 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GADAdLoader.h>
#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/GADAdSizeDelegate.h>
#import <GoogleMobileAds/GADAppEventDelegate.h>

GAD_ASSUME_NONNULL_BEGIN

/// Ad loader options for banner ads.
@interface DFPBannerViewOptions : GADAdLoaderOptions

/// Optional delegate that is notified if the loaded banner sends app events.
@property(nonatomic, weak, GAD_NULLABLE) id<GADAppEventDelegate> appEventDelegate;

/// Optional delegate that is notified if the loaded banner changes size.
@property(nonatomic, weak, GAD_NULLABLE) id<GADAdSizeDelegate> adSizeDelegate;

/// Whether the publisher will record impressions manually when the ad becomes visible to the user.
@property(nonatomic, assign) BOOL enableManualImpressions;

@end

GAD_ASSUME_NONNULL_END
