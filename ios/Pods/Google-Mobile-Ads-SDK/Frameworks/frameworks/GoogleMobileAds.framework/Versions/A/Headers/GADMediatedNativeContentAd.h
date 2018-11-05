//
//  GADMediatedNativeContentAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADMediatedNativeAd.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Provides methods used for constructing native content ads.
@protocol GADMediatedNativeContentAd<GADMediatedNativeAd>

/// Primary text headline.
- (NSString *GAD_NULLABLE_TYPE)headline;

/// Secondary text.
- (NSString *GAD_NULLABLE_TYPE)body;

/// List of large images. Each object is an instance of GADNativeAdImage.
- (NSArray *GAD_NULLABLE_TYPE)images;

/// Small logo image.
- (GADNativeAdImage *GAD_NULLABLE_TYPE)logo;

/// Text that encourages user to take some action with the ad.
- (NSString *GAD_NULLABLE_TYPE)callToAction;

/// Identifies the advertiser. For example, the advertiser’s name or visible URL.
- (NSString *GAD_NULLABLE_TYPE)advertiser;

@optional

/// AdChoices view.
- (UIView *GAD_NULLABLE_TYPE)adChoicesView;

@end

GAD_ASSUME_NONNULL_END
