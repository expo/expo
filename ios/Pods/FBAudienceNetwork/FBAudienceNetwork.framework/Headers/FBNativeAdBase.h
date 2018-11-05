// Copyright 2004-present Facebook. All Rights Reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <UIKit/UIKit.h>

#import "FBAdSettings.h"

NS_ASSUME_NONNULL_BEGIN

@class FBAdIconView;
@class FBAdImage;
@class FBAdPlacementDefinition;
@class FBAdProvider;
@class FBMediaView;
@class FBNativeAdDataModel;
@class FBNativeAdViewAttributes;

/**
 Determines if caching of the ad's assets should be done before calling adDidLoad
 */
typedef NS_ENUM(NSInteger, FBNativeAdsCachePolicy) {
    /// No ad content is cached
    FBNativeAdsCachePolicyNone,
    /// All content is cached
    FBNativeAdsCachePolicyAll,
};

/**
 The Internal representation of an Ad
 */
@interface FBNativeAdBase : NSObject
/**
 Typed access to the id of the ad placement.
 */
@property (nonatomic, copy, readonly) NSString *placementID;
/**
 Typed access to the ad star rating. See `FBAdStarRating` for details.
 */
@property (nonatomic, assign, readonly) struct FBAdStarRating starRating FB_DEPRECATED;
/**
 Typed access to the headline that the advertiser entered when they created their ad. This is usually the ad's main title.
 */
@property (nonatomic, copy, readonly, nullable) NSString *headline;
/**
 Typed access to the link description which is additional information that the advertiser may have entered.
 */
@property (nonatomic, copy, readonly, nullable) NSString *linkDescription;
/**
 Typed access to the name of the Facebook Page or mobile app that represents the business running the ad.
 */
@property (nonatomic, copy, readonly, nullable) NSString *advertiserName;
/**
 Typed access to the ad social context, for example "Over half a million users".
 */
@property (nonatomic, copy, readonly, nullable) NSString *socialContext;
/**
 Typed access to the call to action phrase of the ad, for example "Install Now".
 */
@property (nonatomic, copy, readonly, nullable) NSString *callToAction;
/**
 Typed access to the body raw untruncated text, Contains the text that the advertiser entered when they created their ad. This often tells people what the ad is promoting.
 */
@property (nonatomic, copy, readonly, nullable) NSString *rawBodyText;
/**
 Typed access to the body text, truncated at length 90, which contains the text that the advertiser entered when they created their ad. This often tells people what the ad is promoting.
 */
@property (nonatomic, copy, readonly, nullable) NSString *bodyText;
/**
 Typed access to the word 'sponsored', translated into the language being used by the person viewing the ad.
 */
@property (nonatomic, copy, readonly, nullable) NSString *sponsoredTranslation;
/**
 Typed access to  the word 'ad', translated into the language being used by the person viewing the ad.
 */
@property (nonatomic, copy, readonly, nullable) NSString *adTranslation;
/**
 Typed access to the word 'promoted', translated into the language being used by the person viewing the ad.
 */
@property (nonatomic, copy, readonly, nullable) NSString *promotedTranslation;
/**
 Typed access to the AdChoices icon. See `FBAdImage` for details. See `FBAdChoicesView` for an included implementation.
 */
@property (nonatomic, strong, readonly, nullable) FBAdImage *adChoicesIcon;
/**
 Aspect ratio of the ad creative.
 */
@property (nonatomic, assign, readonly) CGFloat aspectRatio;
/**
 Typed access to the AdChoices URL. Navigate to this link when the icon is tapped. See `FBAdChoicesView` for an included implementation.
 */
@property (nonatomic, copy, readonly, nullable) NSURL *adChoicesLinkURL;
/**
 Typed access to the AdChoices text, usually a localized version of "AdChoices". See `FBAdChoicesView` for an included implementation.
 */
@property (nonatomic, copy, readonly, nullable) NSString *adChoicesText;

/**
 Read only access to native ad caching policy, it is set in loadAWithMediaCachePolicy:
 */
@property (nonatomic, readonly) FBNativeAdsCachePolicy mediaCachePolicy;

/**
 Call isAdValid to check whether native ad is valid & internal consistent prior rendering using its properties. If
 rendering is done as part of the loadAd callback, it is guarantee to be consistent
 */
@property (nonatomic, getter=isAdValid, readonly) BOOL adValid;

@property (nonatomic, copy, readonly, nullable, getter=getAdNetwork) NSString *adNetwork;

@property (nonatomic, getter=isRegistered, readonly) BOOL registered;

/**
 This is a method to disconnect a FBNativeAd with the UIView you used to display the native ads.
 */
- (void)unregisterView;

/**
 Begins loading the FBNativeAd content.

 You can implement `nativeAdDidLoad:` and `nativeAd:didFailWithError:` methods
 of `FBNativeAdDelegate` if you would like to be notified as loading succeeds or fails.
 */
- (void)loadAd;

/**
 Begins loading the FBNativeAd content.

 You can implement `nativeAdDidLoad:` and `nativeAd:didFailWithError:` methods
 of `FBNativeAdDelegate` if you would like to be notified as loading succeeds or fails.

 - Parameter mediaCachePolicy: controls which media (images, video, etc) from the native ad are cached before the native ad calls nativeAdLoaded on its delegate. The default is to cache everything.
 Note that impression is not logged until the media for the ad is visible on screen (Video or Image for FBNativeAd / Icon for FBNativeBannerAd) and setting this to anything else than FBNativeAdsCachePolicyAll
 will delay the impression call.
 */
- (void)loadAdWithMediaCachePolicy:(FBNativeAdsCachePolicy)mediaCachePolicy;

/**
 Begins loading the FBNativeAd content from a bid payload attained through a server side bid.

 - Parameter bidPayload: The payload of the ad bid. You can get your bid payload from Facebook bidder endpoint.
 */
- (void)loadAdWithBidPayload:(NSString *)bidPayload;

/**
 Begins loading the FBNativeAd content from a bid payload attained through a server side bid.

 - Parameter bidPayload: The payload of the ad bid. You can get your bid payload from Facebook bidder endpoint.

 - Parameter mediaCachePolicy: controls which media (images, video, etc) from the native ad are cached before the native ad calls nativeAdLoaded on its delegate. The default is to cache everything.
 Note that impression is not logged until the media for the ad is visible on screen (Video or Image for FBNativeAd / Icon for FBNativeBannerAd) and setting this to anything else than FBNativeAdsCachePolicyAll
 will delay the impression call.
 */
- (void)loadAdWithBidPayload:(NSString *)bidPayload
            mediaCachePolicy:(FBNativeAdsCachePolicy)mediaCachePolicy;

@end

NS_ASSUME_NONNULL_END
