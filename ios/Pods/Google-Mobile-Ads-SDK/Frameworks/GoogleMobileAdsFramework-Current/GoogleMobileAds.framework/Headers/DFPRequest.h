//
//  DFPRequest.h
//  Google Mobile Ads SDK
//
//  Copyright 2014 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Add this constant to the testDevices property's array to receive test ads on the simulator.
GAD_EXTERN const id _Nonnull kDFPSimulatorID;

/// Specifies optional parameters for ad requests.
@interface DFPRequest : GADRequest

/// Publisher provided user ID.
@property(nonatomic, copy, nullable) NSString *publisherProvidedID;

/// Array of strings used to exclude specified categories in ad results.
@property(nonatomic, copy, nullable) NSArray *categoryExclusions;

/// Key-value pairs used for custom targeting.
@property(nonatomic, copy, nullable) NSDictionary *customTargeting;

@end
