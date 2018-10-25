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

#import "FBSDKTooltipView.h"

#import <CoreText/CoreText.h>

#import "FBSDKCoreKit+Internal.h"

static const CGFloat kTransitionDuration    = 0.3;
static const CGFloat kZoomOutScale          = 0.001f;
static const CGFloat kZoomInScale           = 1.1f;
static const CGFloat kZoomBounceScale       = 0.98f;

static const CGFloat kNUXRectInset        = 6;
static const CGFloat kNUXBubbleMargin     = 17 - kNUXRectInset;
static const CGFloat kNUXPointMargin      = -3;
static const CGFloat kNUXCornerRadius     = 4;
static const CGFloat kNUXStrokeLineWidth  = 0.5f;
static const CGFloat kNUXSideCap          = 6;
static const CGFloat kNUXFontSize         = 10;
static const CGFloat kNUXCrossGlyphSize   = 11;

static CGMutablePathRef _fbsdkCreateUpPointingBubbleWithRect(CGRect rect, CGFloat arrowMidpoint, CGFloat arrowHeight, CGFloat radius);
static CGMutablePathRef _fbsdkCreateDownPointingBubbleWithRect(CGRect rect, CGFloat arrowMidpoint, CGFloat arrowHeight, CGFloat radius);

#pragma mark -

@implementation FBSDKTooltipView
{
  CGPoint _positionInView;
  CFAbsoluteTime _displayTime;
  CFTimeInterval _minimumDisplayDuration;
  UILabel *_textLabel;
  UITapGestureRecognizer *_insideTapGestureRecognizer;
  CGFloat _leftWidth;
  CGFloat _rightWidth;
  CGFloat _arrowMidpoint;
  BOOL _pointingUp;
  BOOL _isFadingOut;
  // style
  UIColor *_innerStrokeColor;
  CGFloat _arrowHeight;
  CGFloat _textPadding;
  CGFloat _maximumTextWidth;
  CGFloat _verticalTextOffset;
  CGFloat _verticalCrossOffset;
  FBSDKTooltipColorStyle _colorStyle;
  NSArray *_gradientColors;
  UIColor *_crossCloseGlyphColor;
}

- (instancetype)initWithTagline:(NSString *)tagline message:(NSString *)message colorStyle:(FBSDKTooltipColorStyle)colorStyle
{
  self = [super initWithFrame:CGRectZero];
  if (self) {
    // Define style
    _textLabel = [[UILabel alloc] initWithFrame:CGRectZero];
    _textLabel.backgroundColor = [UIColor clearColor];
    _textLabel.autoresizingMask = UIViewAutoresizingFlexibleRightMargin;
    _textLabel.numberOfLines = 0;
    _textLabel.font = [UIFont boldSystemFontOfSize: kNUXFontSize];
    _textLabel.textAlignment = NSTextAlignmentLeft;
    _arrowHeight = 7;
    _textPadding = 10;
    _maximumTextWidth = 185;
    _verticalCrossOffset = - 2.5f;
    _verticalTextOffset = 0;
    _displayDuration = 6.0;
    [self setColorStyle:colorStyle];

    _message = [message copy];
    _tagline = [tagline copy];
    [self setMessage:message tagline:tagline];
    [self addSubview:_textLabel];

    _insideTapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(onTapInTooltip:)];
    [self addGestureRecognizer:_insideTapGestureRecognizer];

    self.opaque = NO;
    self.backgroundColor = [UIColor clearColor];
    self.layer.needsDisplayOnBoundsChange = YES;
    self.layer.shadowColor = [UIColor blackColor].CGColor;
    self.layer.shadowOpacity = 0.5f;
    self.layer.shadowOffset = CGSizeMake(0.0f, 2.0f);
    self.layer.shadowRadius = 5.0f;
    self.layer.masksToBounds = NO;
  }
  return self;
}

- (void)dealloc
{
  [_insideTapGestureRecognizer removeTarget:self action:NULL];
}

#pragma mark - Public Methods

- (void)setMessage:(NSString *)message
{
  if (![message isEqualToString:_message]) {
    _message = [message copy];
    [self setMessage:_message tagline:self.tagline];
  }
}

- (void)setTagline:(NSString *)tagline
{
  if (![tagline isEqualToString:_tagline]) {
    _tagline = [tagline copy];
    [self setMessage:self.message tagline:_tagline];
  }
}

#pragma mark Presentation

- (void)presentFromView:(UIView *)anchorView
{
  UIView *superview = anchorView.window.rootViewController.view;
  if (!superview) {
    return;
  }

  // By default - attach to the top, pointing down
  CGPoint position = CGPointMake(CGRectGetMidX(anchorView.bounds), CGRectGetMinY(anchorView.bounds));
  CGPoint positionInSuperview = [superview convertPoint:position fromView:anchorView];
  FBSDKTooltipViewArrowDirection direction = FBSDKTooltipViewArrowDirectionDown;

  // If not enough space to point up from top of anchor view - point up to it's bottom
  CGFloat bubbleHeight = CGRectGetHeight(_textLabel.bounds) + _verticalTextOffset + _textPadding * 2;
  if (positionInSuperview.y - bubbleHeight - kNUXBubbleMargin < CGRectGetMinY(superview.bounds)) {
    direction = FBSDKTooltipViewArrowDirectionUp;
    position = CGPointMake(CGRectGetMidX(anchorView.bounds), CGRectGetMaxY(anchorView.bounds));
    positionInSuperview = [superview convertPoint:position fromView:anchorView];
  }

  [self presentInView:superview withArrowPosition:positionInSuperview direction:direction];
}

- (void)presentInView:(UIView *)view withArrowPosition:(CGPoint)arrowPosition direction:(FBSDKTooltipViewArrowDirection)arrowDirection
{
  _pointingUp = arrowDirection == FBSDKTooltipViewArrowDirectionUp;
  _positionInView = arrowPosition;
  self.frame = [self layoutSubviewsAndDetermineFrame];

  // Add to view, while invisible.
  self.hidden = YES;
  if ([self superview]) {
    [self removeFromSuperview];
  }
  [view addSubview:self];

  // Layout & schedule dismissal.
  _displayTime = CFAbsoluteTimeGetCurrent();
  _isFadingOut = NO;
  [self scheduleAutomaticFadeout];
  [self layoutSubviews];

  [self animateFadeIn];
}

- (void)dismiss
{
  if (_isFadingOut) {
    return;
  }
  _isFadingOut = YES;

  [self animateFadeOutWithCompletion:^{
    [self removeFromSuperview];
    [self cancelAllScheduledFadeOutMethods];
    self->_isFadingOut = NO;
  }];
}

#pragma mark Style

- (FBSDKTooltipColorStyle)colorStyle
{
  return _colorStyle;
}

- (void)setColorStyle:(FBSDKTooltipColorStyle)colorStyle
{
  _colorStyle = colorStyle;
  switch (colorStyle) {
    case FBSDKTooltipColorStyleNeutralGray:
      _gradientColors = @[
                          (id)(FBSDKUIColorWithRGB(0x51, 0x50, 0x4f).CGColor),
                          (id)(FBSDKUIColorWithRGB(0x2d, 0x2c, 0x2c).CGColor)
                          ];
      _innerStrokeColor = [UIColor colorWithWhite:0.13f alpha:1.0f];
      _crossCloseGlyphColor = [UIColor colorWithWhite:0.69f alpha:1.0f];
      break;

    case FBSDKTooltipColorStyleFriendlyBlue:
    default:
      _gradientColors = @[
                          (id)(FBSDKUIColorWithRGB(0x6e, 0x9c, 0xf5).CGColor),
                          (id)(FBSDKUIColorWithRGB(0x49, 0x74, 0xc6).CGColor)
                          ];
      _innerStrokeColor = [UIColor colorWithRed:0.12f green:0.26f blue:0.55f alpha:1.0f];
      _crossCloseGlyphColor = [UIColor colorWithRed:0.60f green:0.73f blue:1.0f alpha:1.0f];
      break;
  }

  _textLabel.textColor = [UIColor whiteColor];
}

#pragma mark - Private Methods
#pragma mark Animation

- (void)animateFadeIn
{
  // Prepare Animation: Zoom in with bounce. Keep the arrow point in place.
  // Set initial transform (zoomed out) & become visible.
  CGFloat centerPos = self.bounds.size.width / 2.0;
  CGFloat zoomOffsetX = (centerPos - _arrowMidpoint) * (kZoomOutScale - 1.0f);
  CGFloat zoomOffsetY = -0.5f * self.bounds.size.height * (kZoomOutScale - 1.0f);
  if (_pointingUp) {
    zoomOffsetY = -zoomOffsetY;
  }
  self.layer.transform = fbsdkdfl_CATransform3DConcat(fbsdkdfl_CATransform3DMakeScale(kZoomOutScale, kZoomOutScale, kZoomOutScale),
                                                      fbsdkdfl_CATransform3DMakeTranslation(zoomOffsetX, zoomOffsetY, 0));
  self.hidden = NO;

  // Prepare animation steps
  // 1st Step.
  void (^zoomIn)(void) = ^{
    self.alpha = 1.0;

    CGFloat newZoomOffsetX = (centerPos - self->_arrowMidpoint) * (kZoomInScale - 1.0f);
    CGFloat newZoomOffsetY = -0.5f * self.bounds.size.height * (kZoomInScale - 1.0f);
    if (self->_pointingUp) {
      newZoomOffsetY = -newZoomOffsetY;
    }

    CATransform3D scale = fbsdkdfl_CATransform3DMakeScale(kZoomInScale, kZoomInScale, kZoomInScale);
    CATransform3D translate =fbsdkdfl_CATransform3DMakeTranslation(newZoomOffsetX, newZoomOffsetY, 0);
    self.layer.transform = fbsdkdfl_CATransform3DConcat(scale, translate);
  };

  // 2nd Step.
  void (^bounceZoom)(void) = ^{
    CGFloat centerPos2 = self.bounds.size.width / 2.0;
    CGFloat zoomOffsetX2 = (centerPos2 - self->_arrowMidpoint) * (kZoomBounceScale - 1.0f);
    CGFloat zoomOffsetY2 = -0.5f * self.bounds.size.height * (kZoomBounceScale - 1.0f);
    if (self->_pointingUp) {
      zoomOffsetY2 = -zoomOffsetY2;
    }
    self.layer.transform = fbsdkdfl_CATransform3DConcat(fbsdkdfl_CATransform3DMakeScale(kZoomBounceScale, kZoomBounceScale, kZoomBounceScale),
                                                        fbsdkdfl_CATransform3DMakeTranslation(zoomOffsetX2, zoomOffsetY2, 0));
  };

  // 3rd Step.
  void (^normalizeZoom)(void) = ^{
    self.layer.transform = fbsdkdfl_CATransform3DIdentity;
  };

  // Animate 3 steps sequentially
  [UIView animateWithDuration:kTransitionDuration/1.5
                        delay:0
                      options:UIViewAnimationOptionCurveEaseInOut
                   animations:zoomIn
                   completion:^(BOOL finished) {
                     [UIView animateWithDuration:kTransitionDuration/2.2
                                      animations:bounceZoom
                                      completion:^(BOOL innerFinished) {
                                        [UIView animateWithDuration:kTransitionDuration/5
                                                         animations:normalizeZoom];
                                      }];
                   }];
}

- (void) animateFadeOutWithCompletion: (void(^)(void)) completionHandler
{
  [UIView animateWithDuration:0.3
                        delay:0
                      options:UIViewAnimationOptionCurveEaseInOut
                   animations:^{
                     self.alpha = 0.0;
                   }
                   completion:^(BOOL complete) {
                     if(completionHandler)
                       completionHandler();
                   }];
}

#pragma mark Gestures

- (void)onTapInTooltip:(UIGestureRecognizer*)sender
{
  // ignore incomplete tap gestures
  if (sender.state != UIGestureRecognizerStateEnded) {
    return;
  }

  // fade out the tooltip view right away
  [self dismiss];
}

#pragma mark Drawing

CGMutablePathRef _fbsdkCreateUpPointingBubbleWithRect(CGRect rect, CGFloat arrowMidpoint, CGFloat arrowHeight, CGFloat radius)
{
  CGMutablePathRef path = CGPathCreateMutable();
  CGFloat arrowHalfWidth = arrowHeight;
  // start with arrow
  CGPathMoveToPoint(path, NULL, arrowMidpoint - arrowHalfWidth, CGRectGetMinY(rect));
  CGPathAddLineToPoint(path, NULL, arrowMidpoint, CGRectGetMinY(rect) - arrowHeight);
  CGPathAddLineToPoint(path, NULL, arrowMidpoint + arrowHalfWidth, CGRectGetMinY(rect));

  // rest of curved rectangle
  CGPathAddArcToPoint(path, NULL, CGRectGetMaxX(rect), CGRectGetMinY(rect), CGRectGetMaxX(rect), CGRectGetMaxY(rect), radius);
  CGPathAddArcToPoint(path, NULL, CGRectGetMaxX(rect), CGRectGetMaxY(rect), CGRectGetMinX(rect), CGRectGetMaxY(rect), radius);
  CGPathAddArcToPoint(path, NULL, CGRectGetMinX(rect), CGRectGetMaxY(rect), CGRectGetMinX(rect), CGRectGetMinY(rect), radius);
  CGPathAddArcToPoint(path, NULL, CGRectGetMinX(rect), CGRectGetMinY(rect), CGRectGetMaxX(rect), CGRectGetMinY(rect), radius);
  CGPathCloseSubpath(path);
  return path;
}

CGMutablePathRef _fbsdkCreateDownPointingBubbleWithRect(CGRect rect, CGFloat arrowMidpoint, CGFloat arrowHeight, CGFloat radius)
{
  CGMutablePathRef path = CGPathCreateMutable();
  CGFloat arrowHalfWidth = arrowHeight;

  // start with arrow
  CGPathMoveToPoint(path, NULL, arrowMidpoint + arrowHalfWidth, CGRectGetMaxY(rect));
  CGPathAddLineToPoint(path, NULL, arrowMidpoint, CGRectGetMaxY(rect) + arrowHeight);
  CGPathAddLineToPoint(path, NULL, arrowMidpoint - arrowHalfWidth, CGRectGetMaxY(rect));

  // rest of curved rectangle
  CGPathAddArcToPoint(path, NULL, CGRectGetMinX(rect), CGRectGetMaxY(rect), CGRectGetMinX(rect), CGRectGetMinY(rect), radius);
  CGPathAddArcToPoint(path, NULL, CGRectGetMinX(rect), CGRectGetMinY(rect), CGRectGetMaxX(rect), CGRectGetMinY(rect), radius);
  CGPathAddArcToPoint(path, NULL, CGRectGetMaxX(rect), CGRectGetMinY(rect), CGRectGetMaxX(rect), CGRectGetMaxY(rect), radius);
  CGPathAddArcToPoint(path, NULL, CGRectGetMaxX(rect), CGRectGetMaxY(rect), CGRectGetMinX(rect), CGRectGetMaxY(rect), radius);
  CGPathCloseSubpath(path);
  return path;
}

static CGMutablePathRef _createCloseCrossGlyphWithRect(CGRect rect)
{
  CGFloat lineThickness = 0.20f * CGRectGetHeight(rect);

  // One rectangle
  CGMutablePathRef path1 = CGPathCreateMutable();
  CGPathMoveToPoint(path1, NULL, CGRectGetMinX(rect), CGRectGetMinY(rect) + lineThickness);
  CGPathAddLineToPoint(path1, NULL, CGRectGetMinX(rect) + lineThickness, CGRectGetMinY(rect));
  CGPathAddLineToPoint(path1, NULL, CGRectGetMaxX(rect), CGRectGetMaxY(rect) - lineThickness);
  CGPathAddLineToPoint(path1, NULL, CGRectGetMaxX(rect) - lineThickness, CGRectGetMaxY(rect));
  CGPathCloseSubpath(path1);

  // 2nd rectangle - mirrored horizontally
  CGMutablePathRef path2 = CGPathCreateMutable();
  CGPathMoveToPoint(path2, NULL, CGRectGetMinX(rect), CGRectGetMaxY(rect) - lineThickness);
  CGPathAddLineToPoint(path2, NULL, CGRectGetMaxX(rect) - lineThickness, CGRectGetMinY(rect));
  CGPathAddLineToPoint(path2, NULL, CGRectGetMaxX(rect), CGRectGetMinY(rect) + lineThickness);
  CGPathAddLineToPoint(path2, NULL, CGRectGetMinX(rect) + lineThickness, CGRectGetMaxY(rect));
  CGPathCloseSubpath(path2);

  CGMutablePathRef groupedPath = CGPathCreateMutable();
  CGPathAddPath(groupedPath, NULL, path1);
  CGPathAddPath(groupedPath, NULL, path2);
  CFRelease(path1);
  CFRelease(path2);

  return groupedPath;
}

- (void)drawRect:(CGRect)rect
{
  // Ignore dirty rect and just redraw the entire nux bubble
  CGFloat arrowSideMargin = 1 + 0.5f * MAX(kNUXRectInset, _arrowHeight);
  CGFloat arrowYMarginOffset = _pointingUp ? arrowSideMargin : kNUXRectInset;
  CGFloat halfStroke = kNUXStrokeLineWidth / 2.0;
  CGRect outerRect = CGRectMake(kNUXRectInset + halfStroke,
                                arrowYMarginOffset + halfStroke,
                                self.bounds.size.width - 2 * kNUXRectInset - kNUXStrokeLineWidth,
                                self.bounds.size.height - kNUXRectInset - arrowSideMargin - kNUXStrokeLineWidth);
  outerRect = CGRectInset(outerRect, 5, 5);
  CGRect innerRect = CGRectInset(outerRect, kNUXStrokeLineWidth, kNUXStrokeLineWidth);
  CGRect fillRect = CGRectInset(innerRect, kNUXStrokeLineWidth/2.0, kNUXStrokeLineWidth/2.0);
  CGFloat closeCrossGlyphPositionY = MIN(CGRectGetMinY(fillRect) + _textPadding + _verticalCrossOffset,
                                         CGRectGetMidY(fillRect) - 0.5f * kNUXCrossGlyphSize);
  CGRect closeCrossGlyphRect = CGRectMake(CGRectGetMaxX(fillRect) - 2 * kNUXFontSize, closeCrossGlyphPositionY,
                                          kNUXCrossGlyphSize, kNUXCrossGlyphSize);

  // setup and get paths
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGMutablePathRef outerPath;
  CGMutablePathRef innerPath;
  CGMutablePathRef fillPath;
  CGMutablePathRef crossCloseGlyphPath = _createCloseCrossGlyphWithRect(closeCrossGlyphRect);
  CGRect gradientRect = fillRect;
  if (_pointingUp) {
    outerPath = _fbsdkCreateUpPointingBubbleWithRect(outerRect,
                                                _arrowMidpoint, _arrowHeight,
                                                kNUXCornerRadius + kNUXStrokeLineWidth);
    innerPath = _fbsdkCreateUpPointingBubbleWithRect(innerRect,
                                                _arrowMidpoint, _arrowHeight,
                                                kNUXCornerRadius);
    fillPath = _fbsdkCreateUpPointingBubbleWithRect(fillRect,
                                               _arrowMidpoint, _arrowHeight,
                                               kNUXCornerRadius - kNUXStrokeLineWidth);
    gradientRect.origin.y -= _arrowHeight;
    gradientRect.size.height += _arrowHeight;
  } else {
    outerPath = _fbsdkCreateDownPointingBubbleWithRect(outerRect,
                                                  _arrowMidpoint, _arrowHeight,
                                                  kNUXCornerRadius + kNUXStrokeLineWidth);
    innerPath = _fbsdkCreateDownPointingBubbleWithRect(innerRect,
                                                  _arrowMidpoint, _arrowHeight,
                                                  kNUXCornerRadius);
    fillPath = _fbsdkCreateDownPointingBubbleWithRect(fillRect,
                                                 _arrowMidpoint, _arrowHeight,
                                                 kNUXCornerRadius - kNUXStrokeLineWidth);
    gradientRect.size.height += _arrowHeight;
  }
  self.layer.shadowPath = outerPath;

  // This tooltip has two borders, so draw two strokes and a fill.
  CGColorRef strokeColor = _innerStrokeColor.CGColor;
  CGContextSaveGState(context);
  CGContextSetStrokeColorWithColor(context, strokeColor);
  CGContextSetLineWidth(context, kNUXStrokeLineWidth);
  CGContextAddPath(context, innerPath);
  CGContextStrokePath(context);
  CGContextAddPath(context, fillPath);
  CGContextClip(context);
  CGColorSpaceRef rgbColorspace = CGColorSpaceCreateDeviceRGB();
  CGGradientRef gradient = CGGradientCreateWithColors(rgbColorspace, (CFArrayRef)_gradientColors, nil);
  CGColorSpaceRelease(rgbColorspace);
  CGPoint start = CGPointMake(gradientRect.origin.x, gradientRect.origin.y);
  CGPoint end = CGPointMake(gradientRect.origin.x, CGRectGetMaxY(gradientRect));
  CGContextDrawLinearGradient(context, gradient, start, end, 0);
  CGContextAddPath(context, crossCloseGlyphPath);
  CGContextSetFillColorWithColor(context, _crossCloseGlyphColor.CGColor);
  CGContextFillPath(context);
  CGGradientRelease(gradient);
  CGContextRestoreGState(context);
  CFRelease(outerPath);
  CFRelease(innerPath);
  CFRelease(fillPath);
  CFRelease(crossCloseGlyphPath);
}

#pragma mark Layout

- (void)layoutSubviews
{
  [super layoutSubviews];

  // We won't set the frame in layoutSubviews to avoid potential infinite loops.
  // Frame is set in -presentInView:withArrowPosition:direction: method.
  [self layoutSubviewsAndDetermineFrame];
}

- (CGRect)layoutSubviewsAndDetermineFrame
{
  // Compute the positioning of the arrow.
  CGRect screenBounds = [[UIScreen mainScreen] bounds];
  UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;
  if (!UIInterfaceOrientationIsPortrait(orientation)) {
    screenBounds = CGRectMake(0, 0, screenBounds.size.height, screenBounds.size.width);
  }
  CGFloat arrowHalfWidth = _arrowHeight;
  CGFloat arrowXPos = _positionInView.x - arrowHalfWidth;
  arrowXPos = MAX(arrowXPos, kNUXSideCap + kNUXBubbleMargin);
  arrowXPos = MIN(arrowXPos, screenBounds.size.width - kNUXBubbleMargin - kNUXSideCap - 2 * arrowHalfWidth);
  _positionInView = CGPointMake(arrowXPos + arrowHalfWidth, _positionInView.y);

  CGFloat arrowYMarginOffset = _pointingUp ? MAX(kNUXRectInset, _arrowHeight) : kNUXRectInset;

  // Set the lock image frame.
  CGFloat xPos = kNUXRectInset + _textPadding + kNUXStrokeLineWidth;
  CGFloat yPos = arrowYMarginOffset + kNUXStrokeLineWidth + _textPadding;

  // Set the text label frame.
  _textLabel.frame = CGRectMake(xPos,
                                yPos + _verticalTextOffset, // sizing function may not return desired height exactly
                                CGRectGetWidth(_textLabel.bounds),
                                CGRectGetHeight(_textLabel.bounds));

  // Determine the size of the nux bubble.
  CGFloat bubbleHeight = CGRectGetHeight(_textLabel.bounds) + _verticalTextOffset + _textPadding * 2;
  CGFloat crossGlyphWidth = 2 * kNUXFontSize;
  CGFloat bubbleWidth = CGRectGetWidth(_textLabel.bounds) + _textPadding * 2 + kNUXStrokeLineWidth * 2 + crossGlyphWidth;

  // Compute the widths to the left and right of the arrow.
  _leftWidth = roundf(0.5f * (bubbleWidth - 2 * arrowHalfWidth));
  _rightWidth = _leftWidth;
  CGFloat originX = arrowXPos - _leftWidth;
  if (originX < kNUXBubbleMargin) {
    CGFloat xShift = kNUXBubbleMargin - originX;
    originX += xShift;
    _leftWidth -= xShift;
    _rightWidth += xShift;
  } else if (originX + bubbleWidth > screenBounds.size.width - kNUXBubbleMargin) {
    CGFloat xShift = originX + bubbleWidth - (screenBounds.size.width - kNUXBubbleMargin);
    originX -= xShift;
    _leftWidth += xShift;
    _rightWidth -= xShift;
  }

  _arrowMidpoint = _positionInView.x - originX + kNUXRectInset;

  // Set the frame for the view.
  CGFloat nuxWidth = bubbleWidth + 2 * kNUXRectInset;
  CGFloat nuxHeight = bubbleHeight + kNUXRectInset + MAX(kNUXRectInset, _arrowHeight) + 2 * kNUXStrokeLineWidth;
  CGFloat yOrigin = 0;
  if (_pointingUp) {
    yOrigin = _positionInView.y + kNUXPointMargin - MAX(0, kNUXRectInset - _arrowHeight);
  } else {
    yOrigin = _positionInView.y - nuxHeight - kNUXPointMargin + MAX(0, kNUXRectInset - _arrowHeight);
  }

  return CGRectMake(originX - kNUXRectInset,
                    yOrigin,
                    nuxWidth,
                    nuxHeight);
}

#pragma mark Message & Tagline

- (void)setMessage:(NSString *)message tagline:(NSString *)tagline
{
  message = message ?: @"";
  // Ensure tagline is empty string or ends with space
  tagline = tagline ?: @"";
  if ([tagline length] && ![tagline hasSuffix:@" "])
    tagline = [tagline stringByAppendingString:@" "];

  // Concatenate tagline & main message
  message = [tagline stringByAppendingString:message];

  NSRange fullRange = NSMakeRange(0, message.length);
  NSMutableAttributedString *attrString = [[NSMutableAttributedString alloc] initWithString: message];

  UIFont *font=[UIFont boldSystemFontOfSize:kNUXFontSize];
  [attrString addAttribute:NSFontAttributeName value:font range:fullRange];
  [attrString addAttribute:NSForegroundColorAttributeName value:[UIColor whiteColor] range:fullRange];
  if ([tagline length]) {
    [attrString addAttribute:NSForegroundColorAttributeName value: FBSDKUIColorWithRGB(0x6D, 0x87, 0xC7) range:NSMakeRange(0, [tagline length])];
  }

  _textLabel.attributedText = attrString;

  CGSize textLabelSize = [_textLabel sizeThatFits:CGSizeMake(_maximumTextWidth, MAXFLOAT)];
  _textLabel.bounds = CGRectMake(0, 0, textLabelSize.width, textLabelSize.height);
  self.frame = [self layoutSubviewsAndDetermineFrame];
  [self setNeedsDisplay];
}

#pragma mark Auto Dismiss Timeout

- (void)scheduleAutomaticFadeout
{
  [[self class] cancelPreviousPerformRequestsWithTarget:self selector:@selector(scheduleFadeoutRespectingMinimumDisplayDuration) object:nil];

  if (_displayDuration > 0.0 && [self superview]) {
    CFTimeInterval intervalAlreadyDisplaying = CFAbsoluteTimeGetCurrent() - _displayTime;
    CFTimeInterval timeRemainingBeforeAutomaticFadeout = _displayDuration - intervalAlreadyDisplaying;
    if (timeRemainingBeforeAutomaticFadeout > 0.0) {
      [self performSelector:@selector(scheduleFadeoutRespectingMinimumDisplayDuration) withObject:nil afterDelay:timeRemainingBeforeAutomaticFadeout];
    } else {
      [self scheduleFadeoutRespectingMinimumDisplayDuration];
    }
  }
}

- (void)scheduleFadeoutRespectingMinimumDisplayDuration
{
  CFTimeInterval intervalAlreadyDisplaying = CFAbsoluteTimeGetCurrent() - _displayTime;
  CFTimeInterval remainingDisplayTime = _minimumDisplayDuration - intervalAlreadyDisplaying;
  if (remainingDisplayTime > 0.0) {
    [self performSelector:@selector(dismiss) withObject:nil afterDelay:remainingDisplayTime];
  } else {
    [self dismiss];
  }
}

- (void)cancelAllScheduledFadeOutMethods
{
  [[self class] cancelPreviousPerformRequestsWithTarget:self selector:@selector(scheduleFadeoutRespectingMinimumDisplayDuration) object:nil];
  [[self class] cancelPreviousPerformRequestsWithTarget:self selector:@selector(dismiss) object:nil];
}

@end
