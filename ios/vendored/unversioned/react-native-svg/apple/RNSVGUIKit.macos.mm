#import "RNSVGUIKit.h"

@implementation RNSVGView {
  NSColor *_tintColor;
}

- (CGPoint)center
{
  NSRect frameRect = self.frame;
  CGFloat xCenter = frameRect.origin.x + frameRect.size.width / 2;
  CGFloat yCenter = frameRect.origin.y + frameRect.size.height / 2;
  return CGPointMake(xCenter, yCenter);
}

- (void)setCenter:(CGPoint)point
{
  NSRect frameRect = self.frame;
  CGFloat xOrigin = frameRect.origin.x - frameRect.size.width / 2;
  CGFloat yOrigin = frameRect.origin.y - frameRect.size.height / 2;
  self.frame = CGRectMake(xOrigin, yOrigin, frameRect.size.width, frameRect.size.height);
}

- (NSColor *)tintColor
{
  if (_tintColor != nil) {
    return _tintColor;
  }

  // To mimic iOS's tintColor, we crawl up the view hierarchy until either:
  // (a) we find a valid color
  // (b) we reach a view that isn't an RNSVGView
  NSView *parentView = [self superview];
  if ([parentView isKindOfClass:[RNSVGView class]]) {
    return [(RNSVGView *)parentView tintColor];
  } else {
    return [NSColor controlAccentColor];
  }
}

- (void)setTintColor:(NSColor *)tintColor
{
  _tintColor = tintColor;
  [self setNeedsDisplay:YES];
}

@end

@implementation NSImage (RNSVGMacOSExtensions)

- (CGImageRef)CGImage
{
  return [self CGImageForProposedRect:NULL context:NULL hints:NULL];
}

@end

@implementation NSValue (RNSVGMacOSExtensions)

+ (NSValue *)valueWithCGAffineTransform:(CGAffineTransform)transform
{
  return [NSValue valueWithBytes:&transform objCType:@encode(CGAffineTransform)];
}

+ (NSValue *)valueWithCGPoint:(CGPoint)point
{
  return [NSValue valueWithBytes:&point objCType:@encode(CGPoint)];
}

- (CGAffineTransform)CGAffineTransformValue
{
  CGAffineTransform value;
  [self getValue:&value];
  return value;
}

- (CGPoint)CGPointValue
{
  CGPoint value;
  [self getValue:&value];
  return value;
}

@end
