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

#import "FBSDKButton.h"
#import "FBSDKButton+Subclass.h"

#import "FBSDKAccessToken.h"
#import "FBSDKAppEvents+Internal.h"
#import "FBSDKAppEvents.h"
#import "FBSDKApplicationDelegate+Internal.h"
#import "FBSDKLogo.h"
#import "FBSDKMath.h"
#import "FBSDKUIUtility.h"
#import "FBSDKViewImpressionTracker.h"

#define HEIGHT_TO_FONT_SIZE 0.47
#define HEIGHT_TO_MARGIN 0.27
#define HEIGHT_TO_PADDING 0.23
#define HEIGHT_TO_TEXT_PADDING_CORRECTION 0.08

@implementation FBSDKButton
{
  BOOL _skipIntrinsicContentSizing;
  BOOL _isExplicitlyDisabled;
}

#pragma mark - Object Lifecycle

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _skipIntrinsicContentSizing = YES;
    [self configureButton];
    _skipIntrinsicContentSizing = NO;
  }
  return self;
}

- (void)awakeFromNib
{
  [super awakeFromNib];
  _skipIntrinsicContentSizing = YES;
  [self configureButton];
  _skipIntrinsicContentSizing = NO;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Properties

- (void)setEnabled:(BOOL)enabled
{
  _isExplicitlyDisabled = !enabled;
  [self checkImplicitlyDisabled];
}

#pragma mark - Layout

- (CGRect)imageRectForContentRect:(CGRect)contentRect
{
  if (self.hidden || CGRectIsEmpty(self.bounds)) {
    return CGRectZero;
  }
  CGRect imageRect = UIEdgeInsetsInsetRect(contentRect, self.imageEdgeInsets);
  CGFloat margin = [self _marginForHeight:[self _heightForContentRect:contentRect]];
  imageRect = CGRectInset(imageRect, margin, margin);
  imageRect.size.width = CGRectGetHeight(imageRect);
  return imageRect;
}

- (CGSize)intrinsicContentSize
{
  if (_skipIntrinsicContentSizing) {
    return CGSizeZero;
  }
  _skipIntrinsicContentSizing = YES;
  CGSize size = [self sizeThatFits:CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX)];
  _skipIntrinsicContentSizing = NO;
  return size;
}

- (void)layoutSubviews
{
  // automatic impression tracking if the button conforms to FBSDKButtonImpressionTracking
  if ([self conformsToProtocol:@protocol(FBSDKButtonImpressionTracking)]) {
    NSString *eventName = ((id<FBSDKButtonImpressionTracking>)self).impressionTrackingEventName;
    NSString *identifier = ((id<FBSDKButtonImpressionTracking>)self).impressionTrackingIdentifier;
    NSDictionary<NSString *, id> *parameters = ((id<FBSDKButtonImpressionTracking>)self).analyticsParameters;
    if (eventName && identifier) {
      FBSDKViewImpressionTracker *impressionTracker = [FBSDKViewImpressionTracker impressionTrackerWithEventName:eventName];
      [impressionTracker logImpressionWithIdentifier:identifier parameters:parameters];
    }
  }
  [super layoutSubviews];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  if (self.hidden) {
    return CGSizeZero;
  }
  CGSize normalSize = [self sizeThatFits:size title:[self titleForState:UIControlStateNormal]];
  CGSize selectedSize = [self sizeThatFits:size title:[self titleForState:UIControlStateSelected]];
  return CGSizeMake(MAX(normalSize.width, selectedSize.width), MAX(normalSize.height, selectedSize.height));
}

- (void)sizeToFit
{
  CGRect bounds = self.bounds;
  bounds.size = [self sizeThatFits:CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX)];
  self.bounds = bounds;
}

- (CGRect)titleRectForContentRect:(CGRect)contentRect
{
  if (self.hidden || CGRectIsEmpty(self.bounds)) {
    return CGRectZero;
  }
  CGRect imageRect = [self imageRectForContentRect:contentRect];
  CGFloat height = [self _heightForContentRect:contentRect];
  CGFloat padding = [self _paddingForHeight:height];
  CGFloat titleX = CGRectGetMaxX(imageRect) + padding;
  CGRect titleRect = CGRectMake(titleX, 0.0, CGRectGetWidth(contentRect) - titleX, CGRectGetHeight(contentRect));

  UIEdgeInsets titleEdgeInsets = UIEdgeInsetsZero;
  if (!self.layer.needsLayout) {
    UILabel *titleLabel = self.titleLabel;
    if (titleLabel.textAlignment == NSTextAlignmentCenter) {
      // if the text is centered, we need to adjust the frame for the titleLabel based on the size of the text in order
      // to keep the text centered in the button without adding extra blank space to the right when unnecessary
      // 1. the text fits centered within the button without colliding with the image (imagePaddingWidth)
      // 2. the text would run into the image, so adjust the insets to effectively left align it (textPaddingWidth)
      CGSize titleSize = FBSDKTextSize(titleLabel.text,
                                       titleLabel.font,
                                       titleRect.size,
                                       titleLabel.lineBreakMode);
      CGFloat titlePaddingWidth = (CGRectGetWidth(titleRect) - titleSize.width) / 2;
      CGFloat imagePaddingWidth = titleX / 2;
      CGFloat inset = MIN(titlePaddingWidth, imagePaddingWidth);
      titleEdgeInsets.left -= inset;
      titleEdgeInsets.right += inset;
    }
  }
  return UIEdgeInsetsInsetRect(titleRect, titleEdgeInsets);
}

#pragma mark - Subclass Methods

- (void)logTapEventWithEventName:(NSString *)eventName parameters:(NSDictionary *)parameters
{
    [FBSDKAppEvents logImplicitEvent:eventName
                          valueToSum:nil
                          parameters:parameters
                         accessToken:[FBSDKAccessToken currentAccessToken]];
}

- (void)checkImplicitlyDisabled
{
  BOOL enabled = !_isExplicitlyDisabled && !self.implicitlyDisabled;
  BOOL currentEnabled = self.enabled;
  super.enabled = enabled;
  if (currentEnabled != enabled) {
    [self invalidateIntrinsicContentSize];
    [self setNeedsLayout];
  }
}

- (void)configureButton
{
  [self configureWithIcon:[self defaultIcon]
                    title:nil
          backgroundColor:[self defaultBackgroundColor]
         highlightedColor:[self defaultHighlightedColor]];
}

- (void)configureWithIcon:(FBSDKIcon *)icon
                    title:(NSString *)title
          backgroundColor:(UIColor *)backgroundColor
         highlightedColor:(UIColor *)highlightedColor
{
  [self _configureWithIcon:icon
                     title:title
           backgroundColor:backgroundColor
          highlightedColor:highlightedColor
             selectedTitle:nil
              selectedIcon:nil
             selectedColor:nil
  selectedHighlightedColor:nil];
}

- (void)configureWithIcon:(FBSDKIcon *)icon
                    title:(NSString *)title
          backgroundColor:(UIColor *)backgroundColor
         highlightedColor:(UIColor *)highlightedColor
            selectedTitle:(NSString *)selectedTitle
             selectedIcon:(FBSDKIcon *)selectedIcon
            selectedColor:(UIColor *)selectedColor
 selectedHighlightedColor:(UIColor *)selectedHighlightedColor
{
  [self _configureWithIcon:icon
                     title:title
           backgroundColor:backgroundColor
          highlightedColor:highlightedColor
             selectedTitle:selectedTitle
              selectedIcon:selectedIcon
             selectedColor:selectedColor
  selectedHighlightedColor:selectedHighlightedColor];
}

- (UIColor *)defaultBackgroundColor
{
  return [UIColor colorWithRed:65.0/255.0 green:93.0/255.0 blue:174.0/255.0 alpha:1.0];
}

- (UIColor *)defaultDisabledColor
{
  return [UIColor colorWithRed:189.0/255.0 green:193.0/255.0 blue:201.0/255.0 alpha:1.0];
}

- (UIFont *)defaultFont
{
  return [UIFont systemFontOfSize:14];
}

- (UIColor *)defaultHighlightedColor
{
  return [UIColor colorWithRed:47.0/255.0 green:71.0/255.0 blue:122.0/255.0 alpha:1.0];
}

- (FBSDKIcon *)defaultIcon
{
  return [[FBSDKLogo alloc] init];
}

- (UIColor *)defaultSelectedColor
{
  return [UIColor colorWithRed:124.0/255.0 green:143.0/255.0 blue:200.0/255.0 alpha:1.0];
}

- (BOOL)isImplicitlyDisabled
{
  return NO;
}

- (CGSize)sizeThatFits:(CGSize)size title:(NSString *)title
{
  UIFont *font = self.titleLabel.font;
  CGFloat height = [self _heightForFont:font];

  UIEdgeInsets contentEdgeInsets = self.contentEdgeInsets;

  CGSize constrainedContentSize = FBSDKEdgeInsetsInsetSize(size, contentEdgeInsets);

  CGSize titleSize = FBSDKTextSize(title, font, constrainedContentSize, self.titleLabel.lineBreakMode);

  CGFloat padding = [self _paddingForHeight:height];
  CGFloat textPaddingCorrection = [self _textPaddingCorrectionForHeight:height];
  CGSize contentSize = CGSizeMake(height + padding + titleSize.width - textPaddingCorrection, height);
  return FBSDKEdgeInsetsOutsetSize(contentSize, contentEdgeInsets);
}

#pragma mark - Helper Methods

- (void)_applicationDidBecomeActiveNotification:(NSNotification *)notification
{
  [self checkImplicitlyDisabled];
}

- (UIImage *)_backgroundImageWithColor:(UIColor *)color cornerRadius:(CGFloat)cornerRadius scale:(CGFloat)scale
{
  CGFloat size = 1.0 + 2 * cornerRadius;
  UIGraphicsBeginImageContextWithOptions(CGSizeMake(size, size), NO, scale);
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSetFillColorWithColor(context, color.CGColor);
  CGMutablePathRef path = CGPathCreateMutable();
  CGPathMoveToPoint(path, NULL, cornerRadius + 1.0, 0.0);
  CGPathAddArcToPoint(path, NULL, size, 0.0, size, cornerRadius, cornerRadius);
  CGPathAddLineToPoint(path, NULL, size, cornerRadius + 1.0);
  CGPathAddArcToPoint(path, NULL, size, size, cornerRadius + 1.0, size, cornerRadius);
  CGPathAddLineToPoint(path, NULL, cornerRadius, size);
  CGPathAddArcToPoint(path, NULL, 0.0, size, 0.0, cornerRadius + 1.0, cornerRadius);
  CGPathAddLineToPoint(path, NULL, 0.0, cornerRadius);
  CGPathAddArcToPoint(path, NULL, 0.0, 0.0, cornerRadius, 0.0, cornerRadius);
  CGPathCloseSubpath(path);
  CGContextAddPath(context, path);
  CGPathRelease(path);
  CGContextFillPath(context);
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
#if TARGET_OS_TV
  return [image resizableImageWithCapInsets:UIEdgeInsetsMake(cornerRadius, cornerRadius, cornerRadius, cornerRadius)
                               resizingMode:UIImageResizingModeStretch];
#else
  return [image stretchableImageWithLeftCapWidth:cornerRadius topCapHeight:cornerRadius];
#endif
}

- (void)_configureWithIcon:(FBSDKIcon *)icon
                     title:(NSString *)title
           backgroundColor:(UIColor *)backgroundColor
          highlightedColor:(UIColor *)highlightedColor
             selectedTitle:(NSString *)selectedTitle
              selectedIcon:(FBSDKIcon *)selectedIcon
             selectedColor:(UIColor *)selectedColor
  selectedHighlightedColor:(UIColor *)selectedHighlightedColor
{
  [self checkImplicitlyDisabled];

  if (!icon) {
    icon = [self defaultIcon];
  }
  if (!backgroundColor) {
    backgroundColor = [self defaultBackgroundColor];
  }
  if (!highlightedColor) {
    highlightedColor = [self defaultHighlightedColor];
  }
  if (!selectedColor) {
    selectedColor = [self defaultSelectedColor];
  }
  if (!selectedHighlightedColor) {
    selectedHighlightedColor = highlightedColor;
  }

  self.adjustsImageWhenDisabled = NO;
  self.adjustsImageWhenHighlighted = NO;
  self.contentHorizontalAlignment = UIControlContentHorizontalAlignmentFill;
  self.contentVerticalAlignment = UIControlContentVerticalAlignmentFill;
  self.tintColor = [UIColor whiteColor];

  BOOL forceSizeToFit = CGRectIsEmpty(self.bounds);

  CGFloat scale = [UIScreen mainScreen].scale;
  UIImage *backgroundImage;

  backgroundImage = [self _backgroundImageWithColor:backgroundColor cornerRadius:3.0 scale:scale];
  [self setBackgroundImage:backgroundImage forState:UIControlStateNormal];
#if TARGET_OS_TV
  [self setBackgroundImage:backgroundImage forState:UIControlStateFocused];
#endif

  backgroundImage = [self _backgroundImageWithColor:highlightedColor cornerRadius:3.0 scale:scale];
  [self setBackgroundImage:backgroundImage forState:UIControlStateHighlighted];

  backgroundImage = [self _backgroundImageWithColor:[self defaultDisabledColor] cornerRadius:3.0 scale:scale];
  [self setBackgroundImage:backgroundImage forState:UIControlStateDisabled];

  if (selectedColor) {
    backgroundImage = [self _backgroundImageWithColor:selectedColor cornerRadius:3.0 scale:scale];
    [self setBackgroundImage:backgroundImage forState:UIControlStateSelected];
  }

  if (selectedHighlightedColor) {
    backgroundImage = [self _backgroundImageWithColor:selectedHighlightedColor cornerRadius:3.0 scale:scale];
    [self setBackgroundImage:backgroundImage forState:UIControlStateSelected | UIControlStateHighlighted];
#if TARGET_OS_TV
    [self setBackgroundImage:backgroundImage forState:UIControlStateSelected | UIControlStateFocused];
#endif
  }

  [self setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];

  [self setTitle:title forState:UIControlStateNormal];
#if TARGET_OS_TV
  [self setTitle:title forState:UIControlStateFocused];
#endif
  if (selectedTitle) {
    [self setTitle:selectedTitle forState:UIControlStateSelected];
    [self setTitle:selectedTitle forState:UIControlStateSelected | UIControlStateHighlighted];
#if TARGET_OS_TV
    [self setTitle:selectedTitle forState:UIControlStateSelected | UIControlStateFocused];
#endif
  }

  UILabel *titleLabel = self.titleLabel;
  titleLabel.lineBreakMode = NSLineBreakByClipping;
  UIFont *font = [self defaultFont];
  titleLabel.font = font;

  CGSize imageSize = CGSizeMake(font.pointSize, font.pointSize);
  UIImage *image = [icon imageWithSize:imageSize];
  image = [image resizableImageWithCapInsets:UIEdgeInsetsZero resizingMode:UIImageResizingModeStretch];
  [self setImage:image forState:UIControlStateNormal];
#if TARGET_OS_TV
  [self setImage:image forState:UIControlStateFocused];
#endif

  if (selectedIcon) {
    UIImage *selectedImage = [selectedIcon imageWithSize:imageSize];
    selectedImage = [selectedImage resizableImageWithCapInsets:UIEdgeInsetsZero
                                                  resizingMode:UIImageResizingModeStretch];
    [self setImage:selectedImage forState:UIControlStateSelected];
    [self setImage:selectedImage forState:UIControlStateSelected | UIControlStateHighlighted];
#if TARGET_OS_TV
    [self setImage:selectedImage forState:UIControlStateSelected | UIControlStateFocused];
#endif
  }

  if (forceSizeToFit) {
    [self sizeToFit];
  }
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_applicationDidBecomeActiveNotification:)
                                               name:FBSDKApplicationDidBecomeActiveNotification
                                             object:[FBSDKApplicationDelegate sharedInstance]];
}

- (CGFloat)_fontSizeForHeight:(CGFloat)height
{
  return floorf(height * HEIGHT_TO_FONT_SIZE);
}

- (CGFloat)_heightForContentRect:(CGRect)contentRect
{
  UIEdgeInsets contentEdgeInsets = self.contentEdgeInsets;
  return contentEdgeInsets.top + CGRectGetHeight(contentRect) + contentEdgeInsets.bottom;
}

- (CGFloat)_heightForFont:(UIFont *)font
{
  return floorf(font.pointSize / (1 - 2 * HEIGHT_TO_MARGIN));
}

- (CGFloat)_marginForHeight:(CGFloat)height
{
  return floorf(height * HEIGHT_TO_MARGIN);
}

- (CGFloat)_paddingForHeight:(CGFloat)height
{
  return roundf(height * HEIGHT_TO_PADDING) - [self _textPaddingCorrectionForHeight:height];
}

- (CGFloat)_textPaddingCorrectionForHeight:(CGFloat)height
{
  return floorf(height * HEIGHT_TO_TEXT_PADDING_CORRECTION);
}

@end
