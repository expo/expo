// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageCornerRadii.h>
#import <React/RCTUtils.h>
#import <React/RCTI18nUtil.h>

static CGFloat EXImageDefaultIfNegativeTo(CGFloat defaultValue, CGFloat x)
{
  return x >= 0 ? x : defaultValue;
};

#define RADII_COUNT 9

@implementation EXImageCornerRadii {
  CGFloat _radii[RADII_COUNT];
  BOOL _invalidated;
  CGRect _cachedBounds;
  RCTCornerRadii _cachedRadii;
}

- (instancetype)init
{
  if (self = [super init]) {
    _invalidated = YES;
    _layoutDirection = UIUserInterfaceLayoutDirectionLeftToRight;
    for (int i = 0; i < RADII_COUNT; i++) {
      _radii[i] = -1;
    }
  }
  return self;
}


#pragma mark Properties

- (void)setLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if (_layoutDirection != layoutDirection) {
    _layoutDirection = layoutDirection;
    _invalidated = YES;
  }
}


#pragma mark Methods

- (CGFloat)radiusForCorner:(EXImageCorner)corner
{
  return _radii[corner];
}

- (BOOL)setRadius:(CGFloat)radius corner:(EXImageCorner)corner
{
  if (_radii[corner] != radius) {
    _radii[corner] = radius;
    _invalidated = YES;
    return YES;
  }
  return NO;
}

- (void)updateClipMaskForLayer:(CALayer *)layer bounds:(CGRect)bounds
{
  RCTCornerRadii radii = [self radiiForBounds:bounds];
  
  CALayer *mask = nil;
  CGFloat cornerRadius = 0;
  
  if (RCTCornerRadiiAreEqual(radii)) {
    cornerRadius = radii.topLeft;
  } else {
    CAShapeLayer *shapeLayer = [CAShapeLayer layer];
    RCTCornerInsets cornerInsets = RCTGetCornerInsets(radii, UIEdgeInsetsZero);
    CGPathRef path = RCTPathCreateWithRoundedRect(bounds, cornerInsets, NULL);
    shapeLayer.path = path;
    CGPathRelease(path);
    mask = shapeLayer;
  }
  
  layer.cornerRadius = cornerRadius;
  layer.mask = mask;
}

- (void)updateShadowPathForLayer:(CALayer *)layer bounds:(CGRect)bounds
{
  RCTCornerRadii radii = [self radiiForBounds:bounds];
  
  BOOL hasShadow = layer.shadowOpacity * CGColorGetAlpha(layer.shadowColor) > 0;
  if (!hasShadow) {
    layer.shadowPath = nil;
    return;
  }
  
  RCTCornerInsets cornerInsets = RCTGetCornerInsets(radii, UIEdgeInsetsZero);
  CGPathRef path = RCTPathCreateWithRoundedRect(bounds, cornerInsets, NULL);
  layer.shadowPath = path;
  CGPathRelease(path);
}

- (RCTCornerRadii)radiiForBounds:(CGRect)bounds;
{
  if (!_invalidated && CGRectEqualToRect(_cachedBounds, bounds)) {
    return _cachedRadii;
  }
  
  const BOOL isRTL = _layoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  const CGFloat radius = MAX(0, _radii[EXImageCornerAll]);
  RCTCornerRadii result;
  
  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat topStartRadius = EXImageDefaultIfNegativeTo(_radii[EXImageCornerTopLeft], _radii[EXImageCornerTopStart]);
    const CGFloat topEndRadius = EXImageDefaultIfNegativeTo(_radii[EXImageCornerTopRight], _radii[EXImageCornerTopEnd]);
    const CGFloat bottomStartRadius = EXImageDefaultIfNegativeTo(_radii[EXImageCornerBottomLeft], _radii[EXImageCornerBottomStart]);
    const CGFloat bottomEndRadius = EXImageDefaultIfNegativeTo(_radii[EXImageCornerBottomRight], _radii[EXImageCornerBottomEnd]);
    
    const CGFloat directionAwareTopLeftRadius = isRTL ? topEndRadius : topStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? topStartRadius : topEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? bottomEndRadius : bottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? bottomStartRadius : bottomEndRadius;
    
    result.topLeft = EXImageDefaultIfNegativeTo(radius, directionAwareTopLeftRadius);
    result.topRight = EXImageDefaultIfNegativeTo(radius, directionAwareTopRightRadius);
    result.bottomLeft = EXImageDefaultIfNegativeTo(radius, directionAwareBottomLeftRadius);
    result.bottomRight = EXImageDefaultIfNegativeTo(radius, directionAwareBottomRightRadius);
  } else {
    const CGFloat directionAwareTopLeftRadius = isRTL ? _radii[EXImageCornerTopEnd] : _radii[EXImageCornerTopStart];
    const CGFloat directionAwareTopRightRadius = isRTL ? _radii[EXImageCornerTopStart] : _radii[EXImageCornerTopEnd];
    const CGFloat directionAwareBottomLeftRadius = isRTL ? _radii[EXImageCornerBottomEnd] : _radii[EXImageCornerBottomStart];
    const CGFloat directionAwareBottomRightRadius = isRTL ? _radii[EXImageCornerBottomStart] : _radii[EXImageCornerBottomEnd];
    
    result.topLeft =
    EXImageDefaultIfNegativeTo(radius, EXImageDefaultIfNegativeTo(_radii[EXImageCornerTopLeft], directionAwareTopLeftRadius));
    result.topRight =
    EXImageDefaultIfNegativeTo(radius, EXImageDefaultIfNegativeTo(_radii[EXImageCornerTopRight], directionAwareTopRightRadius));
    result.bottomLeft =
    EXImageDefaultIfNegativeTo(radius, EXImageDefaultIfNegativeTo(_radii[EXImageCornerBottomLeft], directionAwareBottomLeftRadius));
    result.bottomRight = EXImageDefaultIfNegativeTo(
                                                            radius, EXImageDefaultIfNegativeTo(_radii[EXImageCornerBottomRight], directionAwareBottomRightRadius));
  }
  
  // Get scale factors required to prevent radii from overlapping
  const CGFloat topScaleFactor = RCTZeroIfNaN(MIN(1, bounds.size.width / (result.topLeft + result.topRight)));
  const CGFloat bottomScaleFactor = RCTZeroIfNaN(MIN(1, bounds.size.width / (result.bottomLeft + result.bottomRight)));
  const CGFloat rightScaleFactor = RCTZeroIfNaN(MIN(1, bounds.size.height / (result.topRight + result.bottomRight)));
  const CGFloat leftScaleFactor = RCTZeroIfNaN(MIN(1, bounds.size.height / (result.topLeft + result.bottomLeft)));
  
  result.topLeft *= MIN(topScaleFactor, leftScaleFactor);
  result.topRight *= MIN(topScaleFactor, rightScaleFactor);
  result.bottomLeft *= MIN(bottomScaleFactor, leftScaleFactor);
  result.bottomRight *= MIN(bottomScaleFactor, rightScaleFactor);
  
  _cachedBounds = bounds;
  _cachedRadii = result;
  _invalidated = NO;
  
  return result;
}

@end
