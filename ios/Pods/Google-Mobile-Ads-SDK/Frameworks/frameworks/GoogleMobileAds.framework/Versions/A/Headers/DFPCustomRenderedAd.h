//
//  DFPCustomRenderedAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2014 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Custom rendered ad. Your application renders the ad.
@interface DFPCustomRenderedAd : NSObject

/// The ad's HTML.
@property(nonatomic, readonly, copy) NSString *adHTML;

/// The base URL of the ad's HTML.
@property(nonatomic, readonly, copy) NSURL *adBaseURL;

/// Call this method when the user clicks the ad.
- (void)recordClick;

/// Call this method when the ad is visible to the user.
- (void)recordImpression;

/// Call this method after the ad has been rendered in a UIView object.
- (void)finishedRenderingAdView:(UIView *)view;

@end

GAD_ASSUME_NONNULL_END
