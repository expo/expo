//
//  GADMediatedNativeAppInstallAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADMediatedNativeAd.h>
#import <GoogleMobileAds/GADNativeAdImage.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Provides methods used for constructing native app install ads. The adapter must return an object
/// conforming to this protocol for native app install ad requests.
@protocol GADMediatedNativeAppInstallAd<GADMediatedNativeAd>

/// App title.
- (NSString *GAD_NULLABLE_TYPE)headline;

/// Array of GADNativeAdImage objects related to the advertised application.
- (NSArray *GAD_NULLABLE_TYPE)images;

/// App description.
- (NSString *GAD_NULLABLE_TYPE)body;

/// Application icon.
- (GADNativeAdImage *GAD_NULLABLE_TYPE)icon;

/// Text that encourages user to take some action with the ad. For example "Install".
- (NSString *GAD_NULLABLE_TYPE)callToAction;

/// App store rating (0 to 5).
- (NSDecimalNumber *GAD_NULLABLE_TYPE)starRating;

/// The app store name. For example, "App Store".
- (NSString *GAD_NULLABLE_TYPE)store;

/// String representation of the app's price.
- (NSString *GAD_NULLABLE_TYPE)price;

@optional

/// AdChoices view.
- (UIView *GAD_NULLABLE_TYPE)adChoicesView;

@end

GAD_ASSUME_NONNULL_END
