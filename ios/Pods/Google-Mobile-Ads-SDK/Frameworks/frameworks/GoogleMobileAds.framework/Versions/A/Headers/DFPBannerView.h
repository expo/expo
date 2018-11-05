//
//  DFPBannerView.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/DFPCustomRenderedBannerViewDelegate.h>
#import <GoogleMobileAds/GADAdLoaderDelegate.h>
#import <GoogleMobileAds/GADAppEventDelegate.h>
#import <GoogleMobileAds/GADBannerView.h>
#import <GoogleMobileAds/GADCorrelator.h>
#import <GoogleMobileAds/GADVideoController.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// The delegate of a GADAdLoader object must conform to this protocol to receive DFPBannerViews.
@protocol DFPBannerAdLoaderDelegate<GADAdLoaderDelegate>

/// Asks the delegate which banner ad sizes should be requested.
- (NSArray<NSValue *> *)validBannerSizesForAdLoader:(GADAdLoader *)adLoader;

/// Tells the delegate that a DFP banner ad was received.
- (void)adLoader:(GADAdLoader *)adLoader didReceiveDFPBannerView:(DFPBannerView *)bannerView;

@end

/// The view that displays DoubleClick For Publishers banner ads.
///
/// To request this ad type using GADAdLoader, you need to pass kGADAdLoaderAdTypeDFPBanner (see
/// GADAdLoaderAdTypes.h) to the |adTypes| parameter in GADAdLoader's initializer method. If you
/// request this ad type, your delegate must conform to the DFPBannerAdLoaderDelegate protocol.
@interface DFPBannerView : GADBannerView

/// Required value created on the DFP website. Create a new ad unit for every unique placement of an
/// ad in your application. Set this to the ID assigned for this placement. Ad units are important
/// for targeting and statistics.
///
/// Example DFP ad unit ID: @"/6499/example/banner"
@property(nonatomic, copy, GAD_NULLABLE) NSString *adUnitID;

/// Optional delegate that is notified when creatives send app events.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet id<GADAppEventDelegate> appEventDelegate;

/// Optional delegate that is notified when creatives cause the banner to change size.
@property(nonatomic, weak, GAD_NULLABLE) IBOutlet id<GADAdSizeDelegate> adSizeDelegate;

/// Optional array of NSValue encoded GADAdSize structs, specifying all valid sizes that are
/// appropriate for this slot. Never create your own GADAdSize directly. Use one of the predefined
/// standard ad sizes (such as kGADAdSizeBanner), or create one using the GADAdSizeFromCGSize
/// method.
///
/// Example:
///
///   <pre>
///   NSArray *validSizes = @[
///     NSValueFromGADAdSize(kGADAdSizeBanner),
///     NSValueFromGADAdSize(kGADAdSizeLargeBanner)
///   ];
///
///   bannerView.validAdSizes = validSizes;
///   </pre>
@property(nonatomic, copy, GAD_NULLABLE) NSArray *validAdSizes;

/// Correlator object for correlating this object to other ad objects.
@property(nonatomic, strong, GAD_NULLABLE) GADCorrelator *correlator;

/// Indicates that the publisher will record impressions manually when the ad becomes visible to the
/// user.
@property(nonatomic, assign) BOOL enableManualImpressions;

/// Optional delegate object for custom rendered ads.
@property(nonatomic, weak, GAD_NULLABLE)
    IBOutlet id<DFPCustomRenderedBannerViewDelegate> customRenderedBannerViewDelegate;

/// Video controller for controlling video rendered by this ad view.
@property(nonatomic, strong, readonly) GADVideoController *videoController;

/// If you've set enableManualImpressions to YES, call this method when the ad is visible.
- (void)recordImpression;

/// Use this function to resize the banner view without launching a new ad request.
- (void)resize:(GADAdSize)size;

/// Sets options that configure ad loading.
///
/// @param adOptions An array of GADAdLoaderOptions objects. The array is deep copied and option
/// objects cannot be modified after calling this method.
- (void)setAdOptions:(NSArray *)adOptions;

#pragma mark Deprecated

/// Deprecated. Use the validAdSizes property.
/// Sets the receiver's valid ad sizes to the values pointed to by the provided NULL terminated list
/// of GADAdSize pointers.
///
/// Example:
///
///   <pre>
///   GADAdSize size1 = kGADAdSizeBanner;
///   GADAdSize size2 = kGADAdSizeLargeBanner;
///   [bannerView setValidAdSizesWithSizes:&size1, &size2, NULL];
///   </pre>
- (void)setValidAdSizesWithSizes:(GADAdSize *)firstSize, ... NS_REQUIRES_NIL_TERMINATION
                                 GAD_DEPRECATED_MSG_ATTRIBUTE("Use validAdSizes property.");

@end

GAD_ASSUME_NONNULL_END
