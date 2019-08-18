//
//  GADMediatedNativeAdDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

@protocol GADMediatedNativeAd;

/// GADMediatedNativeAdDelegate objects handle mediated native ad events.
@protocol GADMediatedNativeAdDelegate<NSObject>

@optional

/// Tells the delegate that the mediated native ad has rendered in |view|, a subview of
/// |viewController|.
- (void)mediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd
         didRenderInView:(UIView *)view
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
/// stop tracking the view's impressions and clicks.
- (void)mediatedNativeAd:(id<GADMediatedNativeAd>)mediatedNativeAd didUntrackView:(UIView *)view;

@end

GAD_ASSUME_NONNULL_END
