// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageBorders.h>
#import <React/RCTUtils.h>
#import <React/RCTI18nUtil.h>

#define BORDER_COUNT 7

static const CGFloat EXImageViewBorderThreshold = 0.001;

EXImageBorderDef EXImageBorderMake(CGFloat width, CGColorRef color, RCTBorderStyle style) {
  EXImageBorderDef border;
  border.width = width;
  border.color = color;
  border.style = style;
  return border;
}

BOOL EXImageBorderVisible(EXImageBorderDef border)
{
  return border.color
  && (border.width >= EXImageViewBorderThreshold)
  && (border.style != RCTBorderStyleUnset);
}

@implementation EXImageBorders {
  EXImageBorderDef _borders[BORDER_COUNT];
  BOOL _invalidated;
  CGRect _cachedBounds;
}

- (instancetype)init
{
  if (self = [super init]) {
    _invalidated = YES;
    _layoutDirection = UIUserInterfaceLayoutDirectionLeftToRight;
    for (int i = 0; i < BORDER_COUNT; i++) {
      _borders[i].width = -1;
      _borders[i].style = RCTBorderStyleUnset;
    }
    _borders[EXImageBorderAll].style = RCTBorderStyleSolid;
  }
  return self;
}

- (void)dealloc
{
  for (int i = 0; i < BORDER_COUNT; i++) {
    CGColorRelease(_borders[i].color);
  }
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

- (CGFloat)widthForBorder:(EXImageBorder)border
{
  return _borders[border].width;
}

- (RCTBorderStyle)styleForBorder:(EXImageBorder)border
{
  return _borders[border].style;
}

- (CGColorRef)colorForBorder:(EXImageBorder)border
{
  return _borders[border].color;
}

- (BOOL)setWidth:(CGFloat)width border:(EXImageBorder)border
{
  if (_borders[border].width != width) {
    _borders[border].width = width;
    _invalidated = YES;
    return YES;
  }
  return NO;
}

- (BOOL)setStyle:(RCTBorderStyle)style border:(EXImageBorder)border
{
  if (_borders[border].style != style) {
    _borders[border].style = style;
    _invalidated = YES;
    return YES;
  }
  return NO;
}

- (BOOL)setColor:(CGColorRef)color border:(EXImageBorder)border
{
  if (CGColorEqualToColor(_borders[border].color, color)) {
    return NO;
  }
  CGColorRelease(_borders[border].color);
  _borders[border].color = CGColorRetain(color);
  return YES;
}

- (void)updateLayersForView:(UIView *)view
                cornerRadii:(RCTCornerRadii)cornerRadii
                     bounds:(CGRect)bounds
               cachedLayers:(NSMutableDictionary<NSString *, CALayer *> *)cachedLayers
{
  NSMutableDictionary<NSString *, CALayer *> *borderLayers = [NSMutableDictionary dictionary];
  
  EXImageBordersDef borders = [self bordersForBounds:bounds];
  
  // Shape-layers draw the stroke in the middle of the path. The border should
  // however be drawn on the inside of the outer path. Therefore calculate the path
  // for CAShapeLayer with an offset to the outside path, so that the stroke edges
  // line-up with the outside path.
  UIEdgeInsets edgeInsets = UIEdgeInsetsMake(borders.top.width * 0.5, borders.left.width * 0.5, borders.bottom.width * 0.5, borders.right.width * 0.5);
  RCTCornerInsets cornerInsets = RCTGetCornerInsets(cornerRadii, edgeInsets);
  CGPathRef shapeLayerPath = RCTPathCreateWithRoundedRect(UIEdgeInsetsInsetRect(bounds, edgeInsets), cornerInsets, NULL);
  
  // Optimized code-path using a single layer when with no required masking
  // This code-path is preferred and yields the best possible performance.
  // When possible, a simple CALayer with optional corner-radius is used.
  // In case the corner-radii are different, a single CAShapeLayer will be used.
  if ([EXImageBorders allEqualBorders:borders]) {
    EXImageBorderDef border = borders.top;
    if (EXImageBorderVisible(border)) {
      CALayer *borderLayer = cachedLayers[@"all"];
      if ((border.style == RCTBorderStyleSolid) &&
          RCTCornerRadiiAreEqual(cornerRadii)) {
        borderLayer = [EXImageBorders createLayerWithBorder:border bounds:bounds cornerRadius:cornerRadii.topLeft cachedLayer:borderLayer];
      } else {
        borderLayer = [EXImageBorders createLayerWithBorder:border bounds:bounds path:shapeLayerPath mask:nil cachedLayer:borderLayer];
      }
      [borderLayers setValue:borderLayer forKey:@"all"];
    }
  } else {
    
    // Define a layer for each visible border. Each layer is masked so that it only
    // shows that edge.
    if (EXImageBorderVisible(borders.top)) {
      [borderLayers setValue:[EXImageBorders createLayerWithBorder:borders.top
                                                            bounds:bounds
                                                              path:shapeLayerPath
                                                              mask:[EXImageBorders createLayerMaskWithBounds:bounds border:EXImageBorderTop borders:borders]
                                                       cachedLayer:cachedLayers[@"top"]] forKey:@"top"];
    }
    if (EXImageBorderVisible(borders.right)) {
      [borderLayers setValue:[EXImageBorders createLayerWithBorder:borders.right
                                                            bounds:bounds
                                                              path:shapeLayerPath
                                                              mask:[EXImageBorders createLayerMaskWithBounds:bounds border:EXImageBorderRight borders:borders]
                                                       cachedLayer:cachedLayers[@"right"]] forKey:@"right"];
    }
    if (EXImageBorderVisible(borders.bottom)) {
      [borderLayers setValue:[EXImageBorders createLayerWithBorder:borders.bottom
                                                            bounds:bounds
                                                              path:shapeLayerPath
                                                              mask:[EXImageBorders createLayerMaskWithBounds:bounds border:EXImageBorderBottom borders:borders]
                                                       cachedLayer:cachedLayers[@"bottom"]] forKey:@"bottom"];
    }
    if (EXImageBorderVisible(borders.left)) {
      [borderLayers setValue:[EXImageBorders createLayerWithBorder:borders.left
                                                            bounds:bounds
                                                              path:shapeLayerPath
                                                              mask:[EXImageBorders createLayerMaskWithBounds:bounds border:EXImageBorderLeft borders:borders]
                                                       cachedLayer:cachedLayers[@"left"]] forKey:@"left"];
    }
  }
  CGPathRelease(shapeLayerPath);
  
  // Add new/updated layers
  for (NSString* key in borderLayers) {
    CALayer *layer = borderLayers[key];
    if (cachedLayers[key] != layer) {
      [view.layer addSublayer:layer];
    }
  }
  
  // Remove old layers
  for (NSString* key in cachedLayers) {
    CALayer *layer = cachedLayers[key];
    if (borderLayers[key] != layer) {
      [layer removeFromSuperlayer];
    }
  }
  
  // Update cache
  [cachedLayers removeAllObjects];
  [cachedLayers addEntriesFromDictionary:borderLayers];
}


#pragma mark Internal methods

+ (BOOL)isEqualBorder:(EXImageBorderDef)border toBorder:(EXImageBorderDef)toBorder
{
  return (ABS(border.width - toBorder.width) < EXImageViewBorderThreshold)
  && (border.style == toBorder.style)
  && CGColorEqualToColor(border.color, toBorder.color);
}

+ (BOOL)allEqualBorders:(EXImageBordersDef)borders
{
  return [EXImageBorders isEqualBorder:borders.top toBorder:borders.right]
  && [EXImageBorders isEqualBorder:borders.top toBorder:borders.bottom]
  && [EXImageBorders isEqualBorder:borders.top toBorder:borders.left];
}

+ (EXImageBorderDef)resolveBorder:(EXImageBorderDef) border defaultBorder:(EXImageBorderDef) defaultBorder
{
  return EXImageBorderMake(
                           (border.width > -1) ? border.width : defaultBorder.width,
                           border.color ? border.color : defaultBorder.color,
                           (border.style != RCTBorderStyleUnset) ? border.style : defaultBorder.style
                           );
}

- (EXImageBordersDef)bordersForBounds:(CGRect)bounds
{
  EXImageBorderDef identityBorder = EXImageBorderMake(-1, nil, RCTBorderStyleSolid);
  EXImageBorderDef defaultBorder = [EXImageBorders resolveBorder:_borders[EXImageBorderAll] defaultBorder:identityBorder];
  
  EXImageBordersDef result;
  result.top = [EXImageBorders resolveBorder:_borders[EXImageBorderTop] defaultBorder:defaultBorder];
  result.bottom = [EXImageBorders resolveBorder:_borders[EXImageBorderBottom] defaultBorder:defaultBorder];
  
  const BOOL isRTL = _layoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    EXImageBorderDef startEdge = [EXImageBorders resolveBorder:_borders[EXImageBorderLeft] defaultBorder:_borders[EXImageBorderStart]];
    EXImageBorderDef endEdge = [EXImageBorders resolveBorder:_borders[EXImageBorderRight] defaultBorder:_borders[EXImageBorderEnd]];
    EXImageBorderDef leftEdge = isRTL ? endEdge : startEdge;
    EXImageBorderDef rightEdge = isRTL ? startEdge : endEdge;
    result.left = [EXImageBorders resolveBorder:leftEdge defaultBorder:defaultBorder];
    result.right = [EXImageBorders resolveBorder:rightEdge defaultBorder:defaultBorder];
  } else {
    EXImageBorderDef leftEdge = isRTL ? _borders[EXImageBorderEnd] : _borders[EXImageBorderStart];
    EXImageBorderDef rightEdge = isRTL ? _borders[EXImageBorderStart] : _borders[EXImageBorderEnd];
    result.left = [EXImageBorders resolveBorder:[EXImageBorders resolveBorder:leftEdge defaultBorder:_borders[EXImageBorderLeft]] defaultBorder:defaultBorder];
    result.right = [EXImageBorders resolveBorder:[EXImageBorders resolveBorder:rightEdge defaultBorder:_borders[EXImageBorderRight]] defaultBorder:defaultBorder];
  }
  return result;
}

+ (CALayer *)createLayerMaskWithBounds:(CGRect)bounds border:(EXImageBorder)border borders:(EXImageBordersDef) borders
{
  UIBezierPath *path = [UIBezierPath bezierPath];
  switch (border) {
    case EXImageBorderLeft:
      [path moveToPoint:bounds.origin];
      if (!EXImageBorderVisible(borders.top)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x + borders.left.width, bounds.origin.y)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + borders.left.width, bounds.origin.y + bounds.size.height * 0.5)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.height * 0.5, bounds.origin.y + bounds.size.height * 0.5)];
      if (!EXImageBorderVisible(borders.bottom)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x + borders.left.width, bounds.origin.y + bounds.size.height * 0.5)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + borders.left.width, bounds.origin.y + bounds.size.height)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x, bounds.origin.y + bounds.size.height)];
      break;
    case EXImageBorderTop:
      [path moveToPoint:bounds.origin];
      if (!EXImageBorderVisible(borders.left)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x, bounds.origin.y + borders.top.width)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width * 0.5, bounds.origin.y + borders.top.width)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width * 0.5, bounds.origin.y + bounds.size.width * 0.5)];
      if (!EXImageBorderVisible(borders.right)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width * 0.5, bounds.origin.y + borders.top.width)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width, bounds.origin.y + borders.top.width)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width, bounds.origin.y)];
      break;
    case EXImageBorderRight:
      [path moveToPoint:CGPointMake(bounds.origin.x + bounds.size.width, bounds.origin.y)];
      if (!EXImageBorderVisible(borders.top)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width - borders.right.width, bounds.origin.y)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width - borders.right.width, bounds.size.height * 0.5)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width - bounds.size.height * 0.5, bounds.origin.y + bounds.size.height * 0.5)];
      if (!EXImageBorderVisible(borders.bottom)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width - borders.right.width, bounds.size.height * 0.5)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width - borders.right.width, bounds.origin.y + bounds.size.height)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width, bounds.origin.y + bounds.size.height)];
      break;
    case EXImageBorderBottom:
      [path moveToPoint:CGPointMake(bounds.origin.x, bounds.origin.y + bounds.size.height)];
      if (!EXImageBorderVisible(borders.left)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x, bounds.origin.y + bounds.size.height - borders.bottom.width)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width * 0.5, bounds.origin.y + bounds.size.height - borders.bottom.width)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width * 0.5, bounds.origin.y + bounds.size.height - bounds.size.width * 0.5)];
      if (!EXImageBorderVisible(borders.right)) {
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width * 0.5, bounds.origin.y + bounds.size.height - borders.bottom.width)];
        [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width, bounds.origin.y + bounds.size.height - borders.bottom.width)];
      }
      [path addLineToPoint:CGPointMake(bounds.origin.x + bounds.size.width, bounds.origin.y + bounds.size.height)];
      break;
  }
  
  [path closePath];
  CAShapeLayer *layer = [CAShapeLayer layer];
  layer.path = path.CGPath;
  return layer;
}

+ (CALayer *)createLayerWithBorder:(EXImageBorderDef)border bounds:(CGRect)bounds cornerRadius:(CGFloat)cornerRadius cachedLayer:(CALayer *)cachedLayer
{
  // Re-use original layer when possible
  cornerRadius = MAX(cornerRadius, 0);
  if (cachedLayer
      && ![cachedLayer isKindOfClass:[CAShapeLayer class]]
      && CGRectEqualToRect(cachedLayer.frame, bounds)
      && (cachedLayer.borderWidth == border.width)
      && CGColorEqualToColor(cachedLayer.borderColor, border.color)
      && (cachedLayer.cornerRadius == cornerRadius)) {
    return cachedLayer;
  }
  
  CALayer *layer = [CALayer layer];
  layer.frame = bounds;
  layer.borderColor = border.color;
  layer.borderWidth = border.width;
  layer.cornerRadius = cornerRadius;
  
  return layer;
}

+ (CALayer *)createLayerWithBorder:(EXImageBorderDef)border bounds:(CGRect)bounds path:(CGPathRef)path mask:(CALayer *)mask cachedLayer:(CALayer *)cachedLayer
{
  // TODO: re-use cached layer if possible?
  
  CAShapeLayer *shapeLayer = [CAShapeLayer layer];
  shapeLayer.frame = bounds;
  shapeLayer.fillColor = UIColor.clearColor.CGColor;
  shapeLayer.strokeColor = border.color;
  shapeLayer.lineWidth = border.width;
  shapeLayer.path = path;
  shapeLayer.mask = mask;
  
  switch (border.style) {
    case RCTBorderStyleDashed:
      shapeLayer.lineCap = kCALineCapSquare;
      shapeLayer.lineDashPattern = @[@(shapeLayer.lineWidth * 2), @(shapeLayer.lineWidth * 4)];
      break;
    case RCTBorderStyleDotted:
      shapeLayer.lineCap = kCALineCapSquare;
      shapeLayer.lineDashPattern = @[@0, @(shapeLayer.lineWidth * 2)];
      break;
    default:
      shapeLayer.lineCap = kCALineCapSquare;
      shapeLayer.lineDashPattern = nil;
      break;
  }
  
  return shapeLayer;
}

@end
