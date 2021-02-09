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
#import <FBAudienceNetwork/FBNativeAdBaseView.h>
#import <FBAudienceNetwork/FBNativeAdViewAttributes.h>
#import <FBAudienceNetwork/FBNativeBannerAd.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Determines the type of native banner ad template. Different views are created
 for different values of FBNativeAdBannerViewType
 */
typedef NS_ENUM(NSInteger, FBNativeBannerAdViewType) {
    /// Fixed height view, 100 points (banner equivalent)
    FBNativeBannerAdViewTypeGenericHeight100 = 1,
    /// Fixed height view, 120 points (banner equivalent)
    FBNativeBannerAdViewTypeGenericHeight120 = 2,
    /// Fixed height view, 50 points (banner equivalent)
    FBNativeBannerAdViewTypeGenericHeight50 = 5,
};

/**
 The FBNativeBannerAdView creates prebuilt native banner ad template views and manages native banner ads.
 */
FB_CLASS_EXPORT
@interface FBNativeBannerAdView : FBNativeAdBaseView

/**
 The type of the view, specifies which template to use
 */
@property (nonatomic, assign, readonly) FBNativeBannerAdViewType type;

/**
 This is a method to create a native ad template using the given placement id and type.
 @param nativeBannerAd The native banner ad to use to create this view.
 @param type The type of this native banner ad template. For more information, consult FBNativeAdBannerViewType.
 */
+ (instancetype)nativeBannerAdViewWithNativeBannerAd:(FBNativeBannerAd *)nativeBannerAd
                                            withType:(FBNativeBannerAdViewType)type;

/**
 This is a method to create a native ad template using the given placement id and type.
 @param nativeBannerAd The native banner ad to use to create this view.
 @param type The type of this native banner ad template. For more information, consult FBNativeAdBannerViewType.
 @param attributes The attributes to render this native ad template with.
 */
+ (instancetype)nativeBannerAdViewWithNativeBannerAd:(FBNativeBannerAd *)nativeBannerAd
                                            withType:(FBNativeBannerAdViewType)type
                                      withAttributes:(FBNativeAdViewAttributes *)attributes;

@end

@interface FBNativeAdViewAttributes (FBNativeBannerAdView)

/**
 Returns default attributes for a given type.

 @param type The type for this layout.
 */
+ (instancetype)defaultAttributesForBannerType:(FBNativeBannerAdViewType)type;

@end

NS_ASSUME_NONNULL_END
