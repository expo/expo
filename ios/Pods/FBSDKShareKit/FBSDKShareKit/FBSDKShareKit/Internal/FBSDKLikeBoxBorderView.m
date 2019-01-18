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

#import "FBSDKLikeBoxBorderView.h"

#import "FBSDKCoreKit+Internal.h"

#define FBSDK_LIKE_BOX_BORDER_CARET_WIDTH 6.0
#define FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT 3.0
#define FBSDK_LIKE_BOX_BORDER_CARET_PADDING 3.0
#define FBSDK_LIKE_BOX_BORDER_CONTENT_PADDING 4.0

@implementation FBSDKLikeBoxBorderView

#pragma mark - Object Lifecycle

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self _initializeContent];
  }
  return self;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [super initWithCoder:decoder])) {
    [self _initializeContent];
  }
  return self;
}

#pragma mark - Properties

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  if (![self.backgroundColor isEqual:backgroundColor]) {
    super.backgroundColor = backgroundColor;
    [self setNeedsDisplay];
  }
}

- (void)setBorderCornerRadius:(CGFloat)borderCornerRadius
{
  if (_borderCornerRadius != borderCornerRadius) {
    _borderCornerRadius = borderCornerRadius;
    [self setNeedsDisplay];
  }
}

- (void)setBorderWidth:(CGFloat)borderWidth
{
  if (_borderWidth != borderWidth) {
    _borderWidth = borderWidth;
    [self setNeedsDisplay];
    [self invalidateIntrinsicContentSize];
  }
}

- (void)setCaretPosition:(FBSDKLikeBoxCaretPosition)caretPosition
{
  if (_caretPosition != caretPosition) {
    _caretPosition = caretPosition;
    [self setNeedsLayout];
    [self setNeedsDisplay];
    [self invalidateIntrinsicContentSize];
  }
}

- (UIEdgeInsets)contentInsets
{
  UIEdgeInsets borderInsets = [self _borderInsets];
  return UIEdgeInsetsMake(borderInsets.top + FBSDK_LIKE_BOX_BORDER_CONTENT_PADDING,
                          borderInsets.left + FBSDK_LIKE_BOX_BORDER_CONTENT_PADDING,
                          borderInsets.bottom + FBSDK_LIKE_BOX_BORDER_CONTENT_PADDING,
                          borderInsets.right + FBSDK_LIKE_BOX_BORDER_CONTENT_PADDING);
}

- (void)setContentView:(UIView *)contentView
{
  if (_contentView != contentView) {
    [_contentView removeFromSuperview];
    _contentView = contentView;
    [self addSubview:_contentView];
    [self setNeedsLayout];
    [self invalidateIntrinsicContentSize];
  }
}

- (void)setFillColor:(UIColor *)fillColor
{
  if (![_fillColor isEqual:fillColor]) {
    _fillColor = fillColor;
    [self setNeedsDisplay];
  }
}

- (void)setForegroundColor:(UIColor *)foregroundColor
{
  if (![_foregroundColor isEqual:foregroundColor]) {
    _foregroundColor = foregroundColor;
    [self setNeedsDisplay];
  }
}

#pragma mark - Layout

- (CGSize)intrinsicContentSize
{
  return FBSDKEdgeInsetsOutsetSize(self.contentView.intrinsicContentSize, self.contentInsets);
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  self.contentView.frame = UIEdgeInsetsInsetRect(self.bounds, self.contentInsets);
}

- (CGSize)sizeThatFits:(CGSize)size
{
  UIEdgeInsets contentInsets = self.contentInsets;
  size = FBSDKEdgeInsetsInsetSize(size, contentInsets);
  size = [self.contentView sizeThatFits:size];
  size = FBSDKEdgeInsetsOutsetSize(size, contentInsets);
  return size;
}

#pragma mark - Drawing

- (void)drawRect:(CGRect)rect
{
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSaveGState(context);

  // read the configuration properties
  CGRect bounds = self.bounds;
  CGFloat borderWidth = self.borderWidth;
  CGFloat borderCornerRadius = self.borderCornerRadius;
  CGFloat contentScaleFactor = self.contentScaleFactor;

  // fill the background
  if (self.backgroundColor) {
    [self.backgroundColor setFill];
    CGContextFillRect(context, bounds);
  }

  // configure the colors and lines
  [self.fillColor setFill];
  [self.foregroundColor setStroke];
  CGContextSetLineJoin(context, kCGLineJoinRound);
  CGContextSetLineWidth(context, borderWidth);

  // get the frame of the box
  CGRect borderFrame = UIEdgeInsetsInsetRect(bounds, [self _borderInsets]);

  // define the arcs for the corners
  const int start = 0;
  const int tangent = 1;
  const int end = 2;
  CGPoint topLeftArc[3] = {
    CGPointMake(CGRectGetMinX(borderFrame) + borderCornerRadius, CGRectGetMinY(borderFrame)),
    CGPointMake(CGRectGetMinX(borderFrame), CGRectGetMinY(borderFrame)),
    CGPointMake(CGRectGetMinX(borderFrame), CGRectGetMinY(borderFrame) + borderCornerRadius),
  };
  CGPoint bottomLeftArc[3] = {
    CGPointMake(CGRectGetMinX(borderFrame), CGRectGetMaxY(borderFrame) - borderCornerRadius),
    CGPointMake(CGRectGetMinX(borderFrame), CGRectGetMaxY(borderFrame)),
    CGPointMake(CGRectGetMinX(borderFrame) + borderCornerRadius, CGRectGetMaxY(borderFrame)),
  };
  CGPoint bottomRightArc[3] = {
    CGPointMake(CGRectGetMaxX(borderFrame) - borderCornerRadius, CGRectGetMaxY(borderFrame)),
    CGPointMake(CGRectGetMaxX(borderFrame), CGRectGetMaxY(borderFrame)),
    CGPointMake(CGRectGetMaxX(borderFrame), CGRectGetMaxY(borderFrame) - borderCornerRadius),
  };
  CGPoint topRightArc[3] = {
    CGPointMake(CGRectGetMaxX(borderFrame), CGRectGetMinY(borderFrame) + borderCornerRadius),
    CGPointMake(CGRectGetMaxX(borderFrame), CGRectGetMinY(borderFrame)),
    CGPointMake(CGRectGetMaxX(borderFrame) - borderCornerRadius, CGRectGetMinY(borderFrame)),
  };

  // start a path on the context
  CGContextBeginPath(context);

  // position the caret and decide which lines to draw
  CGPoint caretPoints[3];
  switch (self.caretPosition) {
    case FBSDKLikeBoxCaretPositionTop:
      CGContextMoveToPoint(context, topRightArc[end].x, topRightArc[end].y);
      caretPoints[0] = CGPointMake(FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidX(borderFrame) + (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)),
                                   CGRectGetMinY(borderFrame));
      caretPoints[1] = CGPointMake(FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidX(borderFrame)),
                                   CGRectGetMinY(borderFrame) - FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT);
      caretPoints[2] = CGPointMake(FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidX(borderFrame) - (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)),
                                   CGRectGetMinY(borderFrame));
      CGContextAddLines(context, caretPoints, sizeof(caretPoints) / sizeof(caretPoints[0]));
      CGContextAddArcToPoint(context, topLeftArc[tangent].x, topLeftArc[tangent].y, topLeftArc[end].x, topLeftArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, bottomLeftArc[start].x, bottomLeftArc[start].y);
      CGContextAddArcToPoint(context, bottomLeftArc[tangent].x, bottomLeftArc[tangent].y, bottomLeftArc[end].x, bottomLeftArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, bottomRightArc[start].x, bottomRightArc[start].y);
      CGContextAddArcToPoint(context, bottomRightArc[tangent].x, bottomRightArc[tangent].y, bottomRightArc[end].x, bottomRightArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, topRightArc[start].x, topRightArc[start].y);
      CGContextAddArcToPoint(context, topRightArc[tangent].x, topRightArc[tangent].y, topRightArc[end].x, topRightArc[end].y, borderCornerRadius);
      break;
    case FBSDKLikeBoxCaretPositionLeft:
      CGContextMoveToPoint(context, topLeftArc[end].x, topLeftArc[end].y);
      caretPoints[0] = CGPointMake(CGRectGetMinX(borderFrame),
                                   FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidY(borderFrame) - (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)));
      caretPoints[1] = CGPointMake(CGRectGetMinX(borderFrame) - FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT,
                                   FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidY(borderFrame)));
      caretPoints[2] = CGPointMake(CGRectGetMinX(borderFrame),
                                   FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidY(borderFrame) + (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)));
      CGContextAddLines(context, caretPoints, sizeof(caretPoints) / sizeof(caretPoints[0]));
      CGContextAddArcToPoint(context, bottomLeftArc[tangent].x, bottomLeftArc[tangent].y, bottomLeftArc[end].x, bottomLeftArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, bottomRightArc[start].x, bottomRightArc[start].y);
      CGContextAddArcToPoint(context, bottomRightArc[tangent].x, bottomRightArc[tangent].y, bottomRightArc[end].x, bottomRightArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, topRightArc[start].x, topRightArc[start].y);
      CGContextAddArcToPoint(context, topRightArc[tangent].x, topRightArc[tangent].y, topRightArc[end].x, topRightArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, topLeftArc[start].x, topLeftArc[start].y);
      CGContextAddArcToPoint(context, topLeftArc[tangent].x, topLeftArc[tangent].y, topLeftArc[end].x, topLeftArc[end].y, borderCornerRadius);
      break;
    case FBSDKLikeBoxCaretPositionBottom:
      CGContextMoveToPoint(context, bottomLeftArc[end].x, bottomLeftArc[end].y);
      caretPoints[0] = CGPointMake(FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidX(borderFrame) - (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)),
                                   CGRectGetMaxY(borderFrame));
      caretPoints[1] = CGPointMake(FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidX(borderFrame)),
                                   CGRectGetMaxY(borderFrame) + FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT);
      caretPoints[2] = CGPointMake(FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidX(borderFrame) + (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)),
                                   CGRectGetMaxY(borderFrame));
      CGContextAddLines(context, caretPoints, sizeof(caretPoints) / sizeof(caretPoints[0]));
      CGContextAddArcToPoint(context, bottomRightArc[tangent].x, bottomRightArc[tangent].y, bottomRightArc[end].x, bottomRightArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, topRightArc[start].x, topRightArc[start].y);
      CGContextAddArcToPoint(context, topRightArc[tangent].x, topRightArc[tangent].y, topRightArc[end].x, topRightArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, topLeftArc[start].x, topLeftArc[start].y);
      CGContextAddArcToPoint(context, topLeftArc[tangent].x, topLeftArc[tangent].y, topLeftArc[end].x, topLeftArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, bottomLeftArc[start].x, bottomLeftArc[start].y);
      CGContextAddArcToPoint(context, bottomLeftArc[tangent].x, bottomLeftArc[tangent].y, bottomLeftArc[end].x, bottomLeftArc[end].y, borderCornerRadius);
      break;
    case FBSDKLikeBoxCaretPositionRight:
      CGContextMoveToPoint(context, bottomRightArc[end].x, bottomRightArc[end].y);
      caretPoints[0] = CGPointMake(CGRectGetMaxX(borderFrame),
                                   FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidY(borderFrame) + (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)));
      caretPoints[1] = CGPointMake(CGRectGetMaxX(borderFrame) + FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT,
                                   FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidY(borderFrame)));
      caretPoints[2] = CGPointMake(CGRectGetMaxX(borderFrame),
                                   FBSDKPointsForScreenPixels(floorf, contentScaleFactor, CGRectGetMidY(borderFrame) - (FBSDK_LIKE_BOX_BORDER_CARET_WIDTH / 2)));
      CGContextAddLines(context, caretPoints, sizeof(caretPoints) / sizeof(caretPoints[0]));
      CGContextAddArcToPoint(context, topRightArc[tangent].x, topRightArc[tangent].y, topRightArc[end].x, topRightArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, topLeftArc[start].x, topLeftArc[start].y);
      CGContextAddArcToPoint(context, topLeftArc[tangent].x, topLeftArc[tangent].y, topLeftArc[end].x, topLeftArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, bottomLeftArc[start].x, bottomLeftArc[start].y);
      CGContextAddArcToPoint(context, bottomLeftArc[tangent].x, bottomLeftArc[tangent].y, bottomLeftArc[end].x, bottomLeftArc[end].y, borderCornerRadius);
      CGContextAddLineToPoint(context, bottomRightArc[start].x, bottomRightArc[start].y);
      CGContextAddArcToPoint(context, bottomRightArc[tangent].x, bottomRightArc[tangent].y, bottomRightArc[end].x, bottomRightArc[end].y, borderCornerRadius);
      break;
  }

  // close and draw now that we have it all
  CGContextClosePath(context);
  CGContextDrawPath(context, kCGPathFillStroke);

  CGContextRestoreGState(context);
}

#pragma mark - Helper Methods

- (UIEdgeInsets)_borderInsets
{
  // inset the border bounds by 1/2 of the border width, since it is drawn split between inside and outside of the path
  CGFloat scale = self.contentScaleFactor;
  CGFloat halfBorderWidth = FBSDKPointsForScreenPixels(ceilf, scale, self.borderWidth / 2);
  UIEdgeInsets borderInsets = UIEdgeInsetsMake(halfBorderWidth, halfBorderWidth, halfBorderWidth, halfBorderWidth);

  // adjust the insets for the caret position
  switch (self.caretPosition) {
    case FBSDKLikeBoxCaretPositionTop:{
      borderInsets.top += FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT + FBSDK_LIKE_BOX_BORDER_CARET_PADDING;
      break;
    }
    case FBSDKLikeBoxCaretPositionLeft:{
      borderInsets.left += FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT + FBSDK_LIKE_BOX_BORDER_CARET_PADDING;
      break;
    }
    case FBSDKLikeBoxCaretPositionBottom:{
      borderInsets.bottom += FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT + FBSDK_LIKE_BOX_BORDER_CARET_PADDING;
      break;
    }
    case FBSDKLikeBoxCaretPositionRight:{
      borderInsets.right += FBSDK_LIKE_BOX_BORDER_CARET_HEIGHT + FBSDK_LIKE_BOX_BORDER_CARET_PADDING;
      break;
    }
  }

  return borderInsets;
}

- (void)_initializeContent
{
  self.backgroundColor = [UIColor clearColor];
  self.borderCornerRadius = 3.0;
  self.borderWidth = 1.0;
  self.contentMode = UIViewContentModeRedraw;
  self.fillColor = [UIColor whiteColor];
  self.foregroundColor = FBSDKUIColorWithRGB(0x6A, 0x71, 0x80);
  self.opaque = NO;
}

@end
