//
//  GADCustomEventBanner.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADAdSize.h>
#import <GoogleMobileAds/GADCustomEventBannerDelegate.h>
#import <GoogleMobileAds/GADCustomEventRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// The banner custom event protocol. Your banner custom event handler must implement this protocol.
@protocol GADCustomEventBanner<NSObject>

/// Inform |delegate| with the custom event execution results to ensure mediation behaves correctly.
///
/// In your class, define the -delegate and -setDelegate: methods or use "@synthesize delegate". The
/// Google Mobile Ads SDK sets this property on instances of your class.
@property(nonatomic, weak, GAD_NULLABLE) id<GADCustomEventBannerDelegate> delegate;

/// Called by mediation when your custom event is scheduled to be executed. Report execution results
/// to the delegate.
///
/// @param adSize The size of the ad as configured in the mediation UI for the mediation placement.
/// @param serverParameter Parameter configured in the mediation UI.
/// @param serverLabel Label configured in the mediation UI.
/// @param request Contains ad request information.
- (void)requestBannerAd:(GADAdSize)adSize
              parameter:(NSString *GAD_NULLABLE_TYPE)serverParameter
                  label:(NSString *GAD_NULLABLE_TYPE)serverLabel
                request:(GADCustomEventRequest *)request;

@end

GAD_ASSUME_NONNULL_END
