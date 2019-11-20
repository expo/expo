//
//  GADSearchBannerView.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google LLC. All rights reserved.
//

#import <GoogleMobileAds/GADAdSizeDelegate.h>
#import <GoogleMobileAds/GADBannerView.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// A view that displays search ads.
/// To show search ads:
///   1) Create a GADSearchBannerView and add it to your view controller's view hierarchy.
///   2) Create a GADSearchRequest ad request object to hold the search query and other search data.
///   3) Call GADSearchBannerView's -loadRequest: method with the GADSearchRequest object.
@interface GADSearchBannerView : GADBannerView

/// If the banner view is initialized with kGADAdSizeFluid and the corresponding request is created
/// with dynamic height parameters, this delegate will be called when the ad size changes.
@property(nonatomic, weak, nullable) IBOutlet id<GADAdSizeDelegate> adSizeDelegate;

@end
