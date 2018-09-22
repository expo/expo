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
#import <FBAudienceNetwork/FBNativeAd.h>
#import <FBAudienceNetwork/FBNativeAdBaseView.h>
#import <FBAudienceNetwork/FBNativeAdViewAttributes.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Determines the type of native ad template. Different views are created
 for different values of FBNativeAdViewType
 */
typedef NS_ENUM(NSInteger, FBNativeAdViewType) {
    /// Fixed height view, 300 points
    FBNativeAdViewTypeGenericHeight300 = 3,
    /// Fixed height view, 400 points
    FBNativeAdViewTypeGenericHeight400 = 4,
};

/**
  The FBNativeAdView creates prebuilt native ad template views and manages native ads.
 */
FB_CLASS_EXPORT
@interface FBNativeAdView : FBNativeAdBaseView

/**
 The type of the view, specifies which template to use
 */
@property (nonatomic, assign, readonly) FBNativeAdViewType type;

/**
 This is a method to create a native ad template using the given placement id and type.
 - Parameter nativeAd: The native ad to use to create this view.
 - Parameter type: The type of this native ad template. For more information, consult FBNativeAdViewType.
 */
+ (instancetype)nativeAdViewWithNativeAd:(FBNativeAd *)nativeAd withType:(FBNativeAdViewType)type;

/**
 This is a method to create a native ad template using the given placement id and type.
 - Parameter nativeAd: The native ad to use to create this view.
 - Parameter type: The type of this native ad template. For more information, consult FBNativeAdViewType.
 - Parameter attributes: The attributes to render this native ad template with.
 */
+ (instancetype)nativeAdViewWithNativeAd:(FBNativeAd *)nativeAd withType:(FBNativeAdViewType)type withAttributes:(FBNativeAdViewAttributes *)attributes;

@end

@interface FBNativeAdViewAttributes (FBNativeAdView)

/**
 Returns default attributes for a given type.

 - Parameter type: The type for this layout.
 */
+ (instancetype)defaultAttributesForType:(FBNativeAdViewType)type;

@end

NS_ASSUME_NONNULL_END
