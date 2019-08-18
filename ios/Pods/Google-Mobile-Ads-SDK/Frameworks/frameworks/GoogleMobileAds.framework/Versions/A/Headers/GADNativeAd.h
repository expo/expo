//
//  GADNativeAd.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

@protocol GADNativeAdDelegate;

/// Native ad base class. All native ad types are subclasses of this class.
@interface GADNativeAd : NSObject

/// Optional delegate to receive state change notifications.
@property(nonatomic, weak, GAD_NULLABLE) id<GADNativeAdDelegate> delegate;

/// Root view controller for handling ad actions.
@property(nonatomic, weak, GAD_NULLABLE) UIViewController *rootViewController;

/// Dictionary of assets which aren't processed by the receiver.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSDictionary *extraAssets;

/// The ad network class name that fetched the current ad. For both standard and mediated Google
/// AdMob ads, this method returns @"GADMAdapterGoogleAdMobAds". For ads fetched via mediation
/// custom events, this method returns @"GADMAdapterCustomEvents".
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *adNetworkClassName;

@end

GAD_ASSUME_NONNULL_END
