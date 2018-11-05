//
//  GADMediationAdRequest.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

/// Provides information which can be used for making ad requests during mediation.
@protocol GADMediationAdRequest<NSObject>

/// Publisher ID set by the publisher on the AdMob frontend.
- (NSString *)publisherId;

/// Mediation configurations set by the publisher on the AdMob frontend.
- (NSDictionary *)credentials;

/// Returns YES if the publisher is requesting test ads.
- (BOOL)testMode;

/// The adapter's ad network extras specified in GADRequest.
- (id<GADAdNetworkExtras>)networkExtras;

/// Returns the value of childDirectedTreatment supplied by the publisher. Returns nil if the
/// publisher hasn't specified child directed treatment. Returns @YES if child directed treatment is
/// enabled.
- (NSNumber *)childDirectedTreatment;

/// The end user's gender set by the publisher in GADRequest. Returns kGADGenderUnknown if it has
/// not been specified.
- (GADGender)userGender;

/// The end user's birthday set by the publisher. Returns nil if it has not been specified.
- (NSDate *)userBirthday;

/// Returns YES if the publisher has specified latitude and longitude location.
- (BOOL)userHasLocation;

/// Returns the user's latitude or 0 if location isn't specified.
- (CGFloat)userLatitude;

/// Returns the user's longitude or 0 if location isn't specified.
- (CGFloat)userLongitude;

/// Returns the user's location accuracy or 0 if location isn't specified.
- (CGFloat)userLocationAccuracyInMeters;

/// Returns user's location description. May return a value even if userHasLocation is NO.
- (NSString *)userLocationDescription;

/// Keywords describing the user's current activity. Example: @"Sport Scores".
- (NSArray *)userKeywords;

@end
