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

/**
 Represents the Facebook ad star rating, which contains the rating value and rating scale.
 */
FB_EXPORT struct FBAdStarRating {
    /// The value of the star rating, X in X/5
    CGFloat value;
    /// The total possible star rating, Y in 4/Y
    NSInteger scale;
} FBAdStarRating;
/**
 Helper view that draws a star rating based off a native ad.
 */
FB_CLASS_EXPORT FB_DEPRECATED
@interface FBAdStarRatingView : UIView

/**
 The current rating from an FBNativeAd. When set, updates the view.
 */
@property (nonatomic, assign) struct FBAdStarRating rating FB_DEPRECATED;

/**
 The color drawn for filled-in stars. Defaults to yellow.
 */
@property (strong, nonatomic) UIColor *primaryColor FB_DEPRECATED;

/**
 The color drawn for empty stars. Defaults to gray.
 */
@property (strong, nonatomic) UIColor *secondaryColor FB_DEPRECATED;

/**
 Initializes a star rating view with a given frame and star rating.

 - Parameter frame: Frame of this view.
 - Parameter starRating: Star rating from a native ad.
 */
- (instancetype)initWithFrame:(CGRect)frame withStarRating:(struct FBAdStarRating)starRating NS_DESIGNATED_INITIALIZER FB_DEPRECATED;

@end
