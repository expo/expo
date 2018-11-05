//
//  GADCorrelatorAdLoaderOptions.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GADAdLoader.h>
#import <GoogleMobileAds/GADCorrelator.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Ad loader options for adding a correlator to a native ad request.
@interface GADCorrelatorAdLoaderOptions : GADAdLoaderOptions

/// Correlator object for correlating ads loaded by an ad loader to other ad objects.
@property(nonatomic, strong, GAD_NULLABLE) GADCorrelator *correlator;

@end

GAD_ASSUME_NONNULL_END
