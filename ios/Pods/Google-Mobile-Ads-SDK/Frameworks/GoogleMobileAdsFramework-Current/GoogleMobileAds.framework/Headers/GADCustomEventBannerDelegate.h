//
//  GADCustomEventBannerDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

@protocol GADCustomEventBanner;

/// Call back to this delegate in your custom event. You must call customEventBanner:didReceiveAd:
/// when there is an ad to show, or customEventBanner:didFailAd: when there is no ad to show.
/// Otherwise, if enough time passed (several seconds) after the SDK called the requestBannerAd:
/// method of your custom event, the mediation SDK will consider the request timed out, and move on
/// to the next ad network.
@protocol GADCustomEventBannerDelegate <NSObject>

/// Your Custom Event object must call this when it receives or creates an ad view.
- (void)customEventBanner:(nonnull id<GADCustomEventBanner>)customEvent
             didReceiveAd:(nonnull UIView *)view;

/// Your Custom Event object must call this when it fails to receive or create the ad view. Pass
/// along any error object sent from the ad network's SDK, or an NSError describing the error. Pass
/// nil if not available.
- (void)customEventBanner:(nonnull id<GADCustomEventBanner>)customEvent
                didFailAd:(nullable NSError *)error;

/// Your Custom Event object should call this when the user touches or "clicks" the ad to initiate
/// an action. When the SDK receives this callback, it reports the click back to the mediation
/// server.
- (void)customEventBannerWasClicked:(nonnull id<GADCustomEventBanner>)customEvent;

/// The rootViewController that you set in GADBannerView. Use this UIViewController to show a modal
/// view when a user taps on the ad.
@property(nonatomic, readonly, nonnull) UIViewController *viewControllerForPresentingModalView;

/// When you call the following methods, the call will be propagated back to the
/// GADBannerViewDelegate that you implemented and passed to GADBannerView.

/// Your Custom Event should call this when the user taps an ad and a modal view appears.
- (void)customEventBannerWillPresentModal:(nonnull id<GADCustomEventBanner>)customEvent;

/// Your Custom Event should call this when the user dismisses the modal view and the modal view is
/// about to go away.
- (void)customEventBannerWillDismissModal:(nonnull id<GADCustomEventBanner>)customEvent;

/// Your Custom Event should call this when the user dismisses the modal view and the modal view has
/// gone away.
- (void)customEventBannerDidDismissModal:(nonnull id<GADCustomEventBanner>)customEvent;

/// Your Custom Event should call this method when a user action will result in App switching.
- (void)customEventBannerWillLeaveApplication:(nonnull id<GADCustomEventBanner>)customEvent;

#pragma mark Deprecated

/// Deprecated. Use customEventBannerWasClicked:.
- (void)customEventBanner:(nonnull id<GADCustomEventBanner>)customEvent
        clickDidOccurInAd:(nonnull UIView *)view
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use customEventBannerWasClicked:.");

@end
