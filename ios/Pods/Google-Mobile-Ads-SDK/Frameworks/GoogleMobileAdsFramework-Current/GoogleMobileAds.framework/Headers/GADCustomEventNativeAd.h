//
//  GADCustomEventNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADCustomEventRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@protocol GADCustomEventNativeAdDelegate;

/// Native ad custom event protocol. Your native ad custom event handler class must conform to this
/// protocol.
@protocol GADCustomEventNativeAd <NSObject>

/// Called when the custom event is scheduled to be executed.
///
/// @param serverParameter A value configured in the mediation UI for the custom event.
/// @param request Ad targeting information.
/// @param adTypes List of requested native ad types. See GADAdLoaderAdTypes.h for available ad
/// types.
/// @param options Additional options configured by the publisher for requesting a native ad. See
/// GADNativeAdImageAdLoaderOptions.h for available image options.
/// @param rootViewController Publisher-provided view controller.
- (void)requestNativeAdWithParameter:(nonnull NSString *)serverParameter
                             request:(nonnull GADCustomEventRequest *)request
                             adTypes:(nonnull NSArray *)adTypes
                             options:(nonnull NSArray *)options
                  rootViewController:(nonnull UIViewController *)rootViewController;

/// Indicates whether the custom event handles user clicks. Return YES if the custom event should
/// handle user clicks. In this case, the Google Mobile Ads SDK doesn't track user clicks and the
/// custom event must notify the Google Mobile Ads SDK of clicks using
/// +[GADMediatedNativeAdNotificationSource mediatedNativeAdDidRecordClick:]. Return NO if the
/// custom event doesn't handles user clicks. In this case, the Google Mobile Ads SDK tracks user
/// clicks itself and the custom event is notified of user clicks via -[GADMediatedUnifiedNativeAd
/// didRecordClickOnAssetWithName:view:viewController:].
- (BOOL)handlesUserClicks;

/// Indicates whether the custom event handles user impressions tracking. If this method returns
/// YES, the Google Mobile Ads SDK will not track user impressions and the custom event must notify
/// the Google Mobile Ads SDK of impressions using +[GADMediatedNativeAdNotificationSource
/// mediatedNativeAdDidRecordImpression:]. If this method returns NO, the Google Mobile Ads SDK
/// tracks user impressions and notifies the custom event of impressions using
/// -[GADMediatedUnifiedNativeAd didRecordImpression].
- (BOOL)handlesUserImpressions;

/// Delegate object used for receiving custom native ad load request progress.
@property(nonatomic, weak, nullable) id<GADCustomEventNativeAdDelegate> delegate;

@end
