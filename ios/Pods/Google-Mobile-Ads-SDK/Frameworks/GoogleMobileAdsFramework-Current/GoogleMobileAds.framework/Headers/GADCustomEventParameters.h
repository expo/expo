//
//  GADCustomEventParameters.h
//  Google Mobile Ads SDK
//
//  Copyright 2016 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Key for getting the server parameter configured in AdMob when mediating to a custom event
/// adapter.
/// Example: NSString *serverParameter = connector.credentials[GADCustomEventParametersServer].
GAD_EXTERN NSString *_Nonnull const GADCustomEventParametersServer;
