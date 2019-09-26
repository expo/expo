//
//  GADInstreamAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADMediaAspectRatio.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADResponseInfo.h>
#import <GoogleMobileAds/GADVideoController.h>
#import <UIKit/UIKit.h>

@class GADInstreamAd;

/// Instream ad load completion handler. On load success, |instreamAd| is the non-nil instream ad
/// and |error| is nil. On load failure, |instreamAd| is nil and |error| provides failure
/// information.
typedef void (^GADInstreamAdLoadCompletionHandler)(GADInstreamAd *_Nullable instreamAd,
                                                   NSError *_Nullable error);

/// An instream ad.
@interface GADInstreamAd : NSObject

/// Loads an instream ad with the provided ad unit ID. Instream ads only support
/// GADMediaAspectRatioLandscape and GADMediaAspectRatioPortrait media aspect ratios, defaulting to
/// GADMediaAspectRatioLandscape. Calls the provided completion handler when the ad load completes.
+ (void)loadAdWithAdUnitID:(nonnull NSString *)adUnitID
                   request:(nullable GADRequest *)request
          mediaAspectRatio:(GADMediaAspectRatio)mediaAspectRatio
         completionHandler:(nonnull GADInstreamAdLoadCompletionHandler)completionHandler;

/// Loads an instream ad with the provided ad tag. Calls the provided completion handler when the
/// ad load completes.
+ (void)loadAdWithAdTag:(nonnull NSString *)adTag
      completionHandler:(nonnull GADInstreamAdLoadCompletionHandler)completionHandler;

/// Video controller for controlling to the video rendered by the instream ad.
@property(nonatomic, readonly, nullable) GADVideoController *videoController;

/// Information about the ad response that returned the ad.
@property(nonatomic, readonly, nonnull) GADResponseInfo *responseInfo;

/// Video duration.
@property(nonatomic, readonly) NSTimeInterval duration;

/// Video's current time.
@property(nonatomic, readonly) NSTimeInterval currentTime;

/// Video aspect ratio (width/height).
@property(nonatomic, readonly) CGFloat aspectRatio;

@end
