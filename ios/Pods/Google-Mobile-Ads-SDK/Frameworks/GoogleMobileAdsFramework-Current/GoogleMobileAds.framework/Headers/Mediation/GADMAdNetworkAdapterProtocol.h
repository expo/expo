//
//  GADMAdNetworkAdapterProtocol.h
//  Google Mobile Ads SDK
//
//  Copyright 2011 Google. All rights reserved.
//

#import <GoogleMobileAds/GoogleMobileAds.h>

#import "GADMAdNetworkConnectorProtocol.h"
#import "GADMEnums.h"

/// Subclasses should prefix their name with "GADMAdapter" example: GADMAdapterGoogleAdMobAds
#define kGADMAdapterClassNamePrefix @"GADMAdapter"

@protocol GADMAdNetworkConnector;

/// Ad network adapter protocol.
@protocol GADMAdNetworkAdapter <NSObject>

/// Returns a version string for the adapter. It can be any string that uniquely identifies the
/// adapter's version. For example, "1.0", or a date such as "20110915".
+ (NSString *)adapterVersion;

/// Returns the extras class that is used by publishers to provide additional parameters to this
/// adapter. Returns Nil if the adapter doesn't have extra publisher provided settings.
+ (Class<GADAdNetworkExtras>)networkExtrasClass;

/// Designated initializer. Adapters can and should store a weak reference to the connector.
/// However, adapters must not keep a strong reference to the connector, as doing so creates a
/// reference cycle and abandoned memory.
- (instancetype)initWithGADMAdNetworkConnector:(id<GADMAdNetworkConnector>)connector;

/// Asks the adapter to initiate an asynchronous banner ad request. The adapter may act as a
/// delegate to your SDK to listen to callbacks. If your SDK doesn't support the given ad size, or
/// doesn't support banner ads, call adapter:didFailAd: on the connector.
- (void)getBannerWithSize:(GADAdSize)adSize;

/// Asks the adapter to initiate an asynchronous interstitial ad request. The adapter may act as a
/// delegate to your SDK to listen to callbacks. If your SDK doesn't support interstitials, call
/// adapter:didFailInterstitial: on the connector.
- (void)getInterstitial;

/// When called, the adapter must remove strong references to itself (e.g., delegate properties and
/// notification observers). You should also call this method in your adapter dealloc to prevent
/// your SDK from interacting with the deallocated adapter. This function may be called multiple
/// times.
- (void)stopBeingDelegate;

/// Presents an interstitial using the supplied UIViewController, by calling
/// presentViewController:animated:completion:.
///
/// Your interstitial should not immediately present itself when it is received. Instead, you should
/// wait until this method is called on your adapter to present the interstitial.
///
/// The adapter must call adapterWillPresentInterstitial: on the connector when the interstitial is
/// about to be presented, and adapterWillDismissInterstitial: and adapterDidDismissInterstitial:
/// when the interstitial is being dismissed.
- (void)presentInterstitialFromRootViewController:(UIViewController *)rootViewController;

@optional

/// Asks the adapter to initiate an asynchronous native ad request. |adTypes| contains the list of
/// native ad types requested. See GADAdLoaderAdTypes.h for available ad types. |options| contains
/// additional options configured by the publisher. See GADNativeAdImageAdLoaderOptions.h for
/// available image options.
///
/// On ad load success or failure, call adapter:didReceiveNativeAdDataSource:mediationDelegate or
/// adapter:didFailAd: on the connector.
- (void)getNativeAdWithAdTypes:(NSArray<GADAdLoaderAdType> *)adTypes
                       options:(NSArray<GADAdLoaderOptions *> *)options;

/// Indicates if the adapter handles user clicks. If the adapter returns YES, it must handle user
/// clicks and notify the Google Mobile Ads SDK of clicks using
/// +[GADMediatedNativeAdNotificationSource mediatedNativeAdDidRecordClick:]. If the adapter returns
/// NO, the Google Mobile Ads SDK handles user clicks and notifies the adapter of clicks using
/// -[GADMediatedNativeAdDelegate
/// mediatedNativeAd:didRecordClickOnAssetWithName:view:viewController:].
- (BOOL)handlesUserClicks;

/// Indicates if the adapter handles user impressions tracking. If the adapter returns YES, the
/// Google Mobile Ads SDK will not track user impressions and the adapter must notify the
/// Google Mobile Ads SDK of impressions using +[GADMediatedNativeAdNotificationSource
/// mediatedNativeAdDidRecordImpression:]. If the adapter returns NO, the Google Mobile Ads SDK
/// tracks user impressions and notifies the adapter of impressions using
/// -[GADMediatedNativeAdDelegate mediatedNativeAdDidRecordImpression:].
- (BOOL)handlesUserImpressions;

/// If your ad network handles multiple ad sizes for the same banner ad, implement this method to be
/// informed of banner size updates. Ad sizes typically change between kGADAdSizeSmartBannerPortrait
/// and kGADAdSizeSmartBannerLandscape. If this method is not implemented, the ad is removed from
/// the user interface when the size changes.
- (void)changeAdSizeTo:(GADAdSize)adSize;

@end
