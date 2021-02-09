//
//  GADMediationAdConfiguration.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdNetworkExtras.h>
#import <GoogleMobileAds/Mediation/GADMediationServerConfiguration.h>
#import <UIKit/UIKit.h>

/// Provided by the Google Mobile Ads SDK for the adapter to render the ad. Contains 3PAS and other
/// ad configuration information.
@interface GADMediationAdConfiguration : NSObject

/// The ad string returned from the 3PAS.
@property(nonatomic, readonly, nullable) NSString *bidResponse;

/// View controller to present from. This value must be read at presentation time to obtain the most
/// recent value. Must be accessed on the main queue.
@property(nonatomic, readonly, nullable) UIViewController *topViewController;

/// Mediation configuration set by the publisher on the AdMob frontend.
@property(nonatomic, readonly, nonnull) GADMediationCredentials *credentials;

/// PNG data containing a watermark that identifies the ad's source.
@property(nonatomic, readonly, nullable) NSData *watermark;

/// Extras the publisher registered with -[GADRequest registerAdNetworkExtras:].
@property(nonatomic, readonly, nullable) id<GADAdNetworkExtras> extras;

/// The value of childDirectedTreatment supplied by the publisher. Is nil if the publisher hasn't
/// specified child directed treatment. Is @YES if child directed treatment is enabled.
@property(nonatomic, readonly, nullable) NSNumber *childDirectedTreatment;

/// Indicates whether the publisher is requesting test ads.
@property(nonatomic, readonly) BOOL isTestRequest;

/// Indicates whether the publisher has specified latitude and longitude location.
@property(nonatomic, readonly) BOOL hasUserLocation;

/// The user's latitude or 0 if location isn't specified.
@property(nonatomic, readonly) CGFloat userLatitude;

/// The user's longitude or 0 if location isn't specified.
@property(nonatomic, readonly) CGFloat userLongitude;

/// The user's location accuracy or 0 if location isn't specified.
@property(nonatomic, readonly) CGFloat userLocationAccuracyInMeters;

@end
