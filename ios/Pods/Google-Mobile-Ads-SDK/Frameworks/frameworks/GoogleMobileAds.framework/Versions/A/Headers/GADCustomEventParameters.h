//
//  GADCustomEventParameters.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Key for getting the server parameter configured in AdMob when mediating to a custom event
/// adapter.
/// Example: NSString *serverParameter = connector.credentials[GADCustomEventParametersServer].
extern NSString *const GADCustomEventParametersServer;

GAD_ASSUME_NONNULL_END
