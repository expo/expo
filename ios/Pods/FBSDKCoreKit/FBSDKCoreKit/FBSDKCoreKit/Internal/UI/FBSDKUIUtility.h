// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
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

/**
  Insets a CGSize with the insets in a UIEdgeInsets.
 */
static inline CGSize FBSDKEdgeInsetsInsetSize(CGSize size, UIEdgeInsets insets)
{
  CGRect rect = CGRectZero;
  rect.size = size;
  return UIEdgeInsetsInsetRect(rect, insets).size;
}

/**
  Outsets a CGSize with the insets in a UIEdgeInsets.
 */
static inline CGSize FBSDKEdgeInsetsOutsetSize(CGSize size, UIEdgeInsets insets)
{
  return CGSizeMake(insets.left + size.width + insets.right,
                    insets.top + size.height + insets.bottom);
}

/**
  Limits a CGFloat value, using the scale to limit to pixels (instead of points).


 The limitFunction is frequention floorf, ceilf or roundf.  If the scale is 2.0,
 you may get back values of *.5 to correspond to pixels.
 */
typedef float (*FBSDKLimitFunctionType)(float);
static inline CGFloat FBSDKPointsForScreenPixels(FBSDKLimitFunctionType limitFunction,
                                                 CGFloat screenScale,
                                                 CGFloat pointValue)
{
  return limitFunction(pointValue * screenScale) / screenScale;
}

static inline CGSize FBSDKTextSize(NSString *text,
                                   UIFont *font,
                                   CGSize constrainedSize,
                                   NSLineBreakMode lineBreakMode)
{
  if (!text) {
    return CGSizeZero;
  }

  NSMutableParagraphStyle *paragraphStyle = [[NSMutableParagraphStyle alloc] init];
  paragraphStyle.lineBreakMode = lineBreakMode;
  NSDictionary *attributes = @{
                               NSFontAttributeName: font,
                               NSParagraphStyleAttributeName: paragraphStyle,
                               };
  NSAttributedString *attributedString = [[NSAttributedString alloc] initWithString:text attributes:attributes];
  CGSize size = [attributedString boundingRectWithSize:constrainedSize
                                               options:(NSStringDrawingUsesDeviceMetrics |
                                                        NSStringDrawingUsesLineFragmentOrigin |
                                                        NSStringDrawingUsesFontLeading)
                                               context:NULL].size;
  return CGSizeMake(ceilf(size.width), ceilf(size.height));
}
