// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXLinearGradient/EXLinearGradientLayer.h>

@implementation EXLinearGradientLayer

- (instancetype)init
{
  self = [super init];

  if (self) {
    self.needsDisplayOnBoundsChange = YES;
    self.masksToBounds = YES;
    _startPoint = CGPointMake(0.5, 0.0);
    _endPoint = CGPointMake(0.5, 1.0);
  }

  return self;
}

- (void)setColors:(NSArray<id> *)colors
{
  _colors = colors;
  [self setNeedsDisplay];
}

- (void)setLocations:(NSArray<NSNumber *> *)locations
{
  _locations = locations;
  [self setNeedsDisplay];
}

- (void)setStartPoint:(CGPoint)startPoint
{
  _startPoint = startPoint;
  [self setNeedsDisplay];
}

- (void)setEndPoint:(CGPoint)endPoint
{
  _endPoint = endPoint;
  [self setNeedsDisplay];
}

- (void)display {
  [super display];

  BOOL hasAlpha = NO;

  for (NSInteger i = 0; i < self.colors.count; i++) {
    hasAlpha = hasAlpha || CGColorGetAlpha(self.colors[i].CGColor) < 1.0;
  }

  UIGraphicsBeginImageContextWithOptions(self.bounds.size, !hasAlpha, 0.0);
  CGContextRef ref = UIGraphicsGetCurrentContext();
  [self drawInContext:ref];

  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  self.contents = (__bridge id _Nullable)(image.CGImage);
  self.contentsScale = image.scale;

  UIGraphicsEndImageContext();
}

- (void)drawInContext:(CGContextRef)ctx
{
  [super drawInContext:ctx];

  CGContextSaveGState(ctx);

  CGSize size = self.bounds.size;
  if (!self.colors || self.colors.count == 0 || size.width == 0.0 || size.height == 0.0)
    return;


  CGFloat *locations = nil;

  locations = malloc(sizeof(CGFloat) * self.colors.count);

  for (NSInteger i = 0; i < self.colors.count; i++) {
    if (self.locations.count > i) {
      locations[i] = self.locations[i].floatValue;
    } else {
      locations[i] = (1.0 / (self.colors.count - 1)) * i;
    }
  }

  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  NSMutableArray *colors = [[NSMutableArray alloc] initWithCapacity:self.colors.count];
  for (UIColor *color in self.colors) {
    [colors addObject:(id)color.CGColor];
  }

  CGGradientRef gradient = CGGradientCreateWithColors(colorSpace, (CFArrayRef)colors, locations);

  free(locations);

  CGPoint start = self.startPoint, end = self.endPoint;

  CGContextDrawLinearGradient(ctx, gradient,
                              CGPointMake(start.x * size.width, start.y * size.height),
                              CGPointMake(end.x * size.width, end.y * size.height),
                              kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation);
  CGGradientRelease(gradient);
  CGColorSpaceRelease(colorSpace);

  CGContextRestoreGState(ctx);
}

@end
