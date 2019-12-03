//
//  GADAdLoader.h
//  Google Mobile Ads SDK
//
//  Copyright 2015 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GADAdLoaderAdTypes.h>
#import <GoogleMobileAds/GADAdLoaderDelegate.h>
#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GADRequestError.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <UIKit/UIKit.h>

/// Ad loader options base class. See each ad type's header for available GADAdLoaderOptions
/// subclasses.
@interface GADAdLoaderOptions : NSObject
@end

/// Loads ads. See GADAdLoaderAdTypes.h for available ad types.
@interface GADAdLoader : NSObject

/// Object notified when an ad request succeeds or fails. Must conform to requested ad types'
/// delegate protocols.
@property(nonatomic, weak, nullable) id<GADAdLoaderDelegate> delegate;

/// The ad loader's ad unit ID.
@property(nonatomic, readonly, nonnull) NSString *adUnitID;

/// Indicates whether the ad loader is loading.
@property(nonatomic, getter=isLoading, readonly) BOOL loading;

/// Returns an initialized ad loader configured to load the specified ad types.
///
/// @param rootViewController The root view controller is used to present ad click actions.
/// @param adTypes An array of ad types. See GADAdLoaderAdTypes.h for available ad types.
/// @param options An array of GADAdLoaderOptions objects to configure how ads are loaded, or nil
/// to use default options. See each ad type's header for available GADAdLoaderOptions subclasses.
- (nonnull instancetype)initWithAdUnitID:(nonnull NSString *)adUnitID
                      rootViewController:(nullable UIViewController *)rootViewController
                                 adTypes:(nonnull NSArray<GADAdLoaderAdType> *)adTypes
                                 options:(nullable NSArray<GADAdLoaderOptions *> *)options;

/// Loads the ad and informs the delegate of the outcome.
- (void)loadRequest:(nullable GADRequest *)request;

@end
