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

NS_ASSUME_NONNULL_BEGIN

@class FBNativeAdBase;

/**
 Minimum dimensions of the view.
 */
extern const CGFloat FBAdOptionsViewWidth;
extern const CGFloat FBAdOptionsViewHeight;

@interface FBAdOptionsView : UIView

/**
 The native ad that provides AdChoices info, such as click url. Setting this updates the nativeAd.
 */
@property (nonatomic, weak, readwrite, nullable) FBNativeAdBase *nativeAd;

/**
 The color to be used when drawing the AdChoices view.
 */
@property (nonatomic, strong, nullable) UIColor *foregroundColor;

/**
 Only show the ad choices triangle icon. Default is NO.

 Sizing note:
    - Single icon is rendered in a square frame, it will default to the smallest dimension.
    - Non single icon requires aspect ratio of the view to be 2.4 or less.
 */
@property (nonatomic, assign) BOOL useSingleIcon;

@end

NS_ASSUME_NONNULL_END
