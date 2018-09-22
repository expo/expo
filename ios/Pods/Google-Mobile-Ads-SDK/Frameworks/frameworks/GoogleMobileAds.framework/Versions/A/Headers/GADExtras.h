//
//  GADExtras.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADAdNetworkExtras.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Ad network extras sent to Google networks.
@interface GADExtras : NSObject<GADAdNetworkExtras>

/// Additional parameters to be sent to Google networks.
@property(nonatomic, copy, GAD_NULLABLE) NSDictionary *additionalParameters;

@end

GAD_ASSUME_NONNULL_END
