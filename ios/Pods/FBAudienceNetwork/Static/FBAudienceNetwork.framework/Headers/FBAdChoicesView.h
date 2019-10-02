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
#import <FBAudienceNetwork/UIView+FBNativeAdViewTag.h>

NS_ASSUME_NONNULL_BEGIN

@class FBAdImage;
@class FBNativeAdBase;
@class FBNativeAdViewAttributes;

/**
  FBAdChoicesView offers a simple way to display a sponsored or AdChoices icon.
 */
FB_CLASS_EXPORT FB_SUBCLASSING_RESTRICTED
@interface FBAdChoicesView : UIView

/**
  Access to the text label contained in this view.
 */
@property (nonatomic, weak, readonly, nullable) UILabel *label;

/**
  Determines whether the background mask is shown, or a transparent mask is used.
 */
@property (nonatomic, assign, getter=isBackgroundShown) BOOL backgroundShown;

/**
  Determines whether the view can be expanded upon being tapped, or defaults to fullsize. Defaults to NO.
 */
@property (nonatomic, assign, readonly, getter=isExpandable) BOOL expandable;

/**
  The native ad that provides AdChoices info, such as the image url, and click url. Setting this updates the nativeAd.
 */
@property (nonatomic, weak, readwrite, nullable) FBNativeAdBase *nativeAd;

/**
  Affects background mask rendering. Setting this property updates the rendering.
 */
@property (nonatomic, assign, readwrite) UIRectCorner corner;

/**
 Affects background mask rendering. Setting this property updates the rendering.
 */
@property (nonatomic, assign, readwrite) UIEdgeInsets insets;

/**
  The view controller to present the ad choices info from. If nil, the top view controller is used.
 */
@property (nonatomic, weak, readwrite, null_resettable) UIViewController *rootViewController;

/**
 The tag for AdChoices view. It always returns FBNativeAdViewTagChoicesIcon.
 */
@property (nonatomic, assign, readonly) FBNativeAdViewTag nativeAdViewTag;

/**
  Initialize this view with a given native ad. Configuration is pulled from the native ad.

 @param nativeAd The native ad to initialize with.
 */
- (instancetype)initWithNativeAd:(FBNativeAdBase *)nativeAd;

/**
  Initialize this view with a given native ad. Configuration is pulled from the native ad.

 @param nativeAd The native ad to initialize with.
 @param expandable Controls whether view defaults to expanded or not, see property documentation
 */
- (instancetype)initWithNativeAd:(FBNativeAdBase *)nativeAd
                      expandable:(BOOL)expandable;

/**
 Initialize this view with a given native ad. Configuration is pulled from the native ad.

 @param nativeAd The native ad to initialize with.
 @param expandable Controls whether view defaults to expanded or not, see property documentation
 @param attributes Attributes to configure look and feel.
 */
- (instancetype)initWithNativeAd:(FBNativeAdBase *)nativeAd
                      expandable:(BOOL)expandable
                      attributes:(nullable FBNativeAdViewAttributes *)attributes;

/**
  Using the superview, this updates the frame of this view, positioning the icon in the top right corner by default.
 */
- (void)updateFrameFromSuperview;

/**
  Using the superview, this updates the frame of this view, positioning the icon in the corner specified. UIRectCornerAllCorners not supported.

 @param corner The corner to display this view from.
 */
- (void)updateFrameFromSuperview:(UIRectCorner)corner;

/**
  Using the superview, this updates the frame of this view, positioning the icon in the corner specified. UIRectCornerAllCorners not supported.

 @param corner The corner to display this view from.
 @param insets Insets to take into account when positioning the view. Only respective insets are applied to corners.
 */
- (void)updateFrameFromSuperview:(UIRectCorner)corner insets:(UIEdgeInsets)insets;

@end

NS_ASSUME_NONNULL_END
