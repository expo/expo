//
//  GADNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

@protocol GADNativeAdDelegate;

/// Native ad base class. All native ad types are subclasses of this class.
@interface GADNativeAd : NSObject

/// Optional delegate to receive state change notifications.
@property(nonatomic, weak, nullable) id<GADNativeAdDelegate> delegate;

/// Reference to a root view controller that is used by the ad to present full screen content after
/// the user interacts with the ad. The root view controller is most commonly the view controller
/// displaying the ad.
@property(nonatomic, weak, nullable) UIViewController *rootViewController;

/// Dictionary of assets which aren't processed by the receiver.
@property(nonatomic, readonly, copy, nullable) NSDictionary *extraAssets;

/// The ad network class name that fetched the current ad. For both standard and mediated Google
/// AdMob ads, this method returns @"GADMAdapterGoogleAdMobAds". For ads fetched via mediation
/// custom events, this method returns @"GADMAdapterCustomEvents".
@property(nonatomic, readonly, copy, nullable) NSString *adNetworkClassName;

@end
