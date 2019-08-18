//
//  GADCustomEventNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GADCustomEventRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

@protocol GADCustomEventNativeAdDelegate;

/// Native ad custom event protocol. Your native ad custom event handler class must conform to this
/// protocol.
@protocol GADCustomEventNativeAd<NSObject>

/// Called when the custom event is scheduled to be executed.
///
/// @param serverParameter A value configured in the mediation UI for the custom event.
/// @param request Ad targeting information.
/// @param adTypes List of requested native ad types. See GADAdLoaderAdTypes.h for available ad
/// types.
/// @param options Additional options configured by the publisher for requesting a native ad. See
/// GADNativeAdImageAdLoaderOptions.h for available image options.
/// @param rootViewController Publisher-provided view controller.
- (void)requestNativeAdWithParameter:(NSString *)serverParameter
                             request:(GADCustomEventRequest *)request
                             adTypes:(NSArray *)adTypes
                             options:(NSArray *)options
                  rootViewController:(UIViewController *)rootViewController;

/// Indicates if the custom event handles user clicks. Return YES if the custom event should handle
/// user clicks. In this case, the Google Mobile Ads SDK doesn't track user clicks and the custom
/// event must notify the Google Mobile Ads SDK of clicks using
/// +[GADMediatedNativeAdNotificationSource mediatedNativeAdDidRecordClick:]. Return NO if the
/// custom event doesn't handles user clicks. In this case, the Google Mobile Ads SDK tracks user
/// clicks itself and the custom event is notified of user clicks via -[GADMediatedNativeAdDelegate
/// mediatedNativeAd:didRecordClickOnAssetWithName:view:viewController:].
- (BOOL)handlesUserClicks;

/// Indicates if the custom event handles user impressions tracking. If this method returns YES, the
/// Google Mobile Ads SDK will not track user impressions and the custom event must notify the
/// Google Mobile Ads SDK of impressions using +[GADMediatedNativeAdNotificationSource
/// mediatedNativeAdDidRecordImpression:]. If this method returns NO,
/// the Google Mobile Ads SDK tracks user impressions and notifies the custom event of impressions
/// using -[GADMediatedNativeAdDelegate mediatedNativeAdDidRecordImpression:].
- (BOOL)handlesUserImpressions;

/// Delegate object used for receiving custom native ad load request progress.
@property(nonatomic, weak, GAD_NULLABLE) id<GADCustomEventNativeAdDelegate> delegate;

@end

GAD_ASSUME_NONNULL_END
