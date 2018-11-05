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

#import <FBAudienceNetwork/FBAdDefines.h>
#import <FBAudienceNetwork/FBAdSettings.h>
#import <FBAudienceNetwork/FBAdStarRatingView.h>
#import <FBAudienceNetwork/FBNativeAdBase.h>

#import "FBAdImage.h"
#import "FBAdStarRatingView.h"

NS_ASSUME_NONNULL_BEGIN

@protocol FBNativeBannerAdDelegate;

@class FBAdIconView;

/**
 The FBNativeBannerAd represents ad metadata to allow you to construct custom ad views.
 See the AdUnitsSample in the sample apps section of the Audience Network framework.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBNativeBannerAd : FBNativeAdBase

@property (nonatomic, weak, nullable) id<FBNativeBannerAdDelegate> delegate;

- (instancetype)initWithPlacementID:(NSString *)placementID;

/**
 This is a method to associate a FBNativeBannerAd with the UIView you will use to display the native ads.

 - Parameter view: The UIView you created to render all the native ads data elements.
 - Parameter iconView: The FBAdIconView you created to render the icon
 - Parameter viewController: The UIViewController that will be used to present SKStoreProductViewController
 (iTunes Store product information) or the in-app browser. If nil is passed, the top view controller currently shown will be used.


 The whole area of the UIView will be clickable.
 */
- (void)registerViewForInteraction:(UIView *)view
                          iconView:(FBAdIconView *)iconView
                    viewController:(nullable UIViewController *)viewController;

/**
 This is a method to associate FBNativeBannerAd with the UIView you will use to display the native ads
 and set clickable areas.

 - Parameter view: The UIView you created to render all the native ads data elements.
 - Parameter iconView: The FBAdIconView you created to render the icon
 - Parameter viewController: The UIViewController that will be used to present SKStoreProductViewController
 (iTunes Store product information). If nil is passed, the top view controller currently shown will be used.
 - Parameter clickableViews: An array of UIView you created to render the native ads data element, e.g.
 CallToAction button, Icon image, which you want to specify as clickable.
 */
- (void)registerViewForInteraction:(UIView *)view
                          iconView:(FBAdIconView *)iconView
                    viewController:(nullable UIViewController *)viewController
                    clickableViews:(nullable NSArray<UIView *> *)clickableViews;

/**
 This is a method to use to download all media for the ad (adChoicesIcon, icon).
 This is only needed to be called if the mediaCachePolicy is set to FBNativeAdsCachePolicyNone.
 */
- (void)downloadMedia;

@end

/**
 The methods declared by the FBNativeBannerAdDelegate protocol allow the adopting delegate to respond to messages
 from the FBNativeBannerAd class and thus respond to operations such as whether the native banner ad has been loaded.
 */
@protocol FBNativeBannerAdDelegate <NSObject>

@optional

/**
 Sent when an FBNativeBannerAd has been successfully loaded.

 - Parameter nativeBannerAd: An FBNativeBannerAd object sending the message.
 */
- (void)nativeBannerAdDidLoad:(FBNativeBannerAd *)nativeBannerAd;

/**
 Sent when an FBNativeBannerAd has succesfully downloaded all media
 */
- (void)nativeBannerAdDidDownloadMedia:(FBNativeBannerAd *)nativeBannerAd;

/**
 Sent immediately before the impression of an FBNativeBannerAd object will be logged.

 - Parameter nativeBannerAd: An FBNativeBannerAd object sending the message.
 */
- (void)nativeBannerAdWillLogImpression:(FBNativeBannerAd *)nativeBannerAd;

/**
 Sent when an FBNativeBannerAd is failed to load.

 - Parameter nativeBannerAd: An FBNativeBannerAd object sending the message.
 - Parameter error: An error object containing details of the error.
 */
- (void)nativeBannerAd:(FBNativeBannerAd *)nativeBannerAd didFailWithError:(NSError *)error;

/**
 Sent after an ad has been clicked by the person.

 - Parameter nativeBannerAd: An FBNativeBannerAd object sending the message.
 */
- (void)nativeBannerAdDidClick:(FBNativeBannerAd *)nativeBannerAd;

/**
 When an ad is clicked, the modal view will be presented. And when the user finishes the
 interaction with the modal view and dismiss it, this message will be sent, returning control
 to the application.

 - Parameter nativeBannerAd: An FBNativeBannerAd object sending the message.
 */
- (void)nativeBannerAdDidFinishHandlingClick:(FBNativeBannerAd *)nativeBannerAd;

@end

NS_ASSUME_NONNULL_END
