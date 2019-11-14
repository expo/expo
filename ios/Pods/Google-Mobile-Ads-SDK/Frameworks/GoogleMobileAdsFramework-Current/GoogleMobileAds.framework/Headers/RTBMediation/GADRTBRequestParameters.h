//
//  GADRTBRequestParameters.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdNetworkExtras.h>
#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/Mediation/GADMediationAdConfiguration.h>
#import <GoogleMobileAds/Mediation/GADMediationServerConfiguration.h>

/// Mediation configuration for a particular ad request.
@interface GADRTBMediationSignalsConfiguration : NSObject

/// Array of mediation credential configurations set by the publisher on the AdMob UI. Each
/// credential configuration is a possible source of ads for the request. The real-time bidding
/// request will include a subset of these configurations.
@property(nonatomic, readonly, nonnull) NSArray<GADMediationCredentials *> *credentials;

@end

/// Request parameters provided by the publisher and Google Mobile Ads SDK.
@interface GADRTBRequestParameters : NSObject

/// Mediation configuration for this request set by the publisher on the AdMob UI.
@property(nonatomic, readonly, nonnull) GADRTBMediationSignalsConfiguration *configuration;

/// Extras the publisher registered with -[GADRequest registerAdNetworkExtras:].
@property(nonatomic, readonly, nullable) id<GADAdNetworkExtras> extras;

#pragma mark - Banner parameters

/// Requested banner ad size. The ad size is kGADAdSizeInvalid for non-banner requests.
@property(nonatomic, readonly) GADAdSize adSize;

@end
