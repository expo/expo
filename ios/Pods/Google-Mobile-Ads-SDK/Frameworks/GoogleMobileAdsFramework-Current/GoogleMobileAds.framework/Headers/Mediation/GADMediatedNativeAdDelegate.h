//
//  GADMediatedNativeAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

NS_ASSUME_NONNULL_BEGIN

@protocol GADMediatedNativeAd;

/// GADMediatedNativeAdDelegate objects handle mediated native ad events.
@protocol GADMediatedNativeAdDelegate <NSObject>

@optional

/// Tells the delegate that the mediated native ad has rendered in |view| with clickable asset views
/// and nonclickable asset views. viewController should be used to present modal views if the ad
/// opens full screen.
- (void)mediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd
           didRenderInView:(UIView *)view
       clickableAssetViews:(NSDictionary<NSString *, UIView *> *)clickableAssetViews
    nonclickableAssetViews:(NSDictionary<NSString *, UIView *> *)nonclickableAssetViews
            viewController:(UIViewController *)viewController;

/// Tells the delegate that the mediated native ad has recorded an impression. This method is called
/// only once per mediated native ad.
- (void)mediatedNativeAdDidRecordImpression:(id<GADMediatedNativeAd>)mediatedNativeAd;

/// Tells the delegate that the mediated native ad has recorded a user click on the asset named
/// |assetName|. Full screen actions should be presented from |viewController|. This method is
/// called only if -[GADMAdNetworkAdapter handlesUserClicks] returns NO.
- (void)mediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd
    didRecordClickOnAssetWithName:(NSString *)assetName
                             view:(UIView *)view
                   viewController:(UIViewController *)viewController;

/// Tells the delegate that the mediated native ad has untracked |view|. This method is called
/// when the mediatedNativeAd is no longer rendered in the provided view and the delegate should
/// stop tracking the view's impressions and clicks. The method may also be called with a nil view
/// when the view in which the mediated native ad has rendered is deallocated.
- (void)mediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd
          didUntrackView:(nullable UIView *)view;

/// Tells the delegate that the mediated native ad has rendered in |view|. viewController should be
/// used to present modal views for the ad.
- (void)mediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd
         didRenderInView:(UIView *)view
          viewController:(UIViewController *)viewController
    GAD_DEPRECATED_MSG_ATTRIBUTE("Use "
                                 "-mediatedNativeAd:didRenderInView:clickableAssetViews:"
                                 "nonclickableAssetViews:viewController: instead.");

@end

NS_ASSUME_NONNULL_END
