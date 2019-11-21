//
//  GADAppOpenAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdValue.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADResponseInfo.h>
#import <UIKit/UIKit.h>

#pragma mark - App Open Ad

@class GADAppOpenAd;

/// The handler block to execute when the ad load operation completes. If the load failed, the
/// appOpenAd is nil and the |error| is non-nil. On success, the appOpenAd is non-nil and the
/// |error| is nil.
typedef void (^GADAppOpenAdLoadCompletionHandler)(GADAppOpenAd *_Nullable appOpenAd,
                                                  NSError *_Nullable error);

/// Ad shown at app open time.
@interface GADAppOpenAd : NSObject

/// Loads an app open ad.
///
/// @param adUnitID An ad unit ID created in the AdMob or Ad Manager UI.
/// @param request An ad request object. If nil, a default ad request object is used.
/// @param orientation The interface orientation that the ad will be presented in.
/// @param completionHandler A handler to execute when the load operation finishes or times out.
+ (void)loadWithAdUnitID:(nonnull NSString *)adUnitID
                 request:(nullable GADRequest *)request
             orientation:(UIInterfaceOrientation)orientation
       completionHandler:(nonnull GADAppOpenAdLoadCompletionHandler)completionHandler;

/// Information about the ad response that returned the ad.
@property(nonatomic, readonly, nonnull) GADResponseInfo *responseInfo;

/// Called when the ad is estimated to have earned money. Available for whitelisted accounts only.
@property(nonatomic, nullable, copy) GADPaidEventHandler paidEventHandler;

@end

#pragma mark - App Open Ad View

/// The handler block to execute when the ad is about to be closed.
typedef void (^GADAppOpenAdCloseHandler)(void);

/// Displays app open ads.
@interface GADAppOpenAdView : UIView

/// The ad displayed in the ad view.
@property(nonatomic, nullable) GADAppOpenAd *appOpenAd;

/// The handler to execute when the ad is about to be closed. The ad is closed when the user clicks
/// the ad's close button or when the ad has been shown for a few seconds.
@property(nonatomic, nullable) GADAppOpenAdCloseHandler adCloseHandler;

@end
