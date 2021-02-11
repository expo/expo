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

#import "TargetConditionals.h"

#if TARGET_OS_TV

 #import "FBSDKDeviceButton.h"

 #import <UIKit/UIKit.h>

 #import "FBSDKCoreKit+Internal.h"

static const CGFloat kFBLogoSize = 54.0;
static const CGFloat kFBLogoLeftMargin = 36.0;
static const CGFloat kRightMargin = 12.0;
static const CGFloat kPreferredPaddingBetweenLogoTitle = 44.0;

@implementation FBSDKDeviceButton

 #pragma mark - Layout

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
  [super didUpdateFocusInContext:context withAnimationCoordinator:coordinator];

  if (self == context.nextFocusedView) {
    [coordinator addCoordinatedAnimations:^{
                   self.transform = CGAffineTransformMakeScale(1.05, 1.05);
                   self.layer.shadowOpacity = 0.5;
                 } completion:NULL];
  } else if (self == context.previouslyFocusedView) {
    [coordinator addCoordinatedAnimations:^{
                   self.transform = CGAffineTransformMakeScale(1.0, 1.0);
                   self.layer.shadowOpacity = 0;
                 } completion:NULL];
  }
}

- (CGRect)imageRectForContentRect:(CGRect)contentRect
{
  CGFloat centerY = CGRectGetMidY(contentRect);
  CGFloat y = centerY - (kFBLogoSize / 2.0);
  return CGRectMake(kFBLogoLeftMargin, y, kFBLogoSize, kFBLogoSize);
}

- (CGRect)titleRectForContentRect:(CGRect)contentRect
{
  if (self.hidden || CGRectIsEmpty(self.bounds)) {
    return CGRectZero;
  }
  CGRect imageRect = [self imageRectForContentRect:contentRect];
  CGFloat titleX = CGRectGetMaxX(imageRect);
  CGRect rect = CGRectMake(titleX, 0, CGRectGetWidth(contentRect) - titleX - kRightMargin, CGRectGetHeight(contentRect));

  if (!self.layer.needsLayout) {
    CGSize titleSize = [FBSDKMath ceilForSize:[self.titleLabel.attributedText boundingRectWithSize:contentRect.size
                                                                                           options:(NSStringDrawingUsesDeviceMetrics
                                                                                             | NSStringDrawingUsesLineFragmentOrigin
                                                                                             | NSStringDrawingUsesFontLeading)
                                                                                           context:NULL].size];
    CGFloat titlePadding = (CGRectGetWidth(rect) - titleSize.width) / 2;
    if (titlePadding > titleX) {
      // if there's room to re-center the text, do so.
      rect = CGRectMake(kRightMargin, 0, CGRectGetWidth(contentRect) - kRightMargin - kRightMargin, CGRectGetHeight(contentRect));
    }
  }

  return rect;
}

 #pragma mark - FBSDKButton

- (UIFont *)defaultFont
{
  return [UIFont systemFontOfSize:38];
}

- (CGSize)sizeThatFits:(CGSize)size attributedTitle:(NSAttributedString *)title
{
  CGSize titleSize = [FBSDKMath ceilForSize:[title boundingRectWithSize:size
                                                                options:(NSStringDrawingUsesDeviceMetrics
                                                                  | NSStringDrawingUsesLineFragmentOrigin
                                                                  | NSStringDrawingUsesFontLeading)
                                                                context:NULL].size];
  CGFloat logoAndTitleWidth = kFBLogoSize + kPreferredPaddingBetweenLogoTitle + titleSize.width + kPreferredPaddingBetweenLogoTitle;
  CGFloat height = 108;
  CGSize contentSize = CGSizeMake(
    kFBLogoLeftMargin + logoAndTitleWidth + kRightMargin,
    height
  );
  return contentSize;
}

- (CGSize)sizeThatFits:(CGSize)size title:(NSString *)title
{
  return [self sizeThatFits:size attributedTitle:[self attributedTitleStringFromString:title]];
}

 #pragma mark - Subclasses

- (NSAttributedString *)attributedTitleStringFromString:(NSString *)string
{
  if (!string) {
    return nil;
  }
  NSMutableParagraphStyle *style = [[NSMutableParagraphStyle alloc] init];
  style.alignment = NSTextAlignmentCenter;
  style.lineBreakMode = NSLineBreakByClipping;
  NSMutableAttributedString *attributedString =
  [[NSMutableAttributedString alloc] initWithString:string
                                         attributes:@{
     NSParagraphStyleAttributeName : style,
     NSFontAttributeName : [self defaultFont],
     NSForegroundColorAttributeName : [UIColor whiteColor]
   }];
  // Now find all the spaces and widen their kerning.
  NSRange range = NSMakeRange(0, string.length);
  while (range.location != NSNotFound) {
    NSRange spaceRange = [string rangeOfString:@" " options:0 range:range];
    if (spaceRange.location == NSNotFound) {
      break;
    }
    [attributedString addAttribute:NSKernAttributeName
                             value:@2.7
                             range:spaceRange];
    range = NSMakeRange(spaceRange.location + 1, string.length - spaceRange.location - 1);
  }
  return attributedString;
}

@end

#endif
