//
//  ABI47_0_0RNSharedElementStyle.m
//  ABI47_0_0React-native-shared-element
//

#import "ABI47_0_0RNSharedElementStyle.h"
#import <ABI47_0_0React/ABI47_0_0RCTView.h>
#import <objc/runtime.h>

@implementation ABI47_0_0RNSharedElementStyle

- (instancetype)init
{
  if ((self = [super init])) {
    _cornerRadii = [ABI47_0_0RNSharedElementCornerRadii new];
  }
  return self;
}

- (instancetype)initWithView:(UIView*) view
{
  if ((self = [super init])) {
    _view = view;
    _size = view.bounds.size;
    _transform = [ABI47_0_0RNSharedElementStyle getAbsoluteViewTransform:view];
    
    // Set base props from style
    CALayer* layer = view.layer;
    _opacity = layer.opacity;
    _borderWidth = layer.borderWidth;
    _borderColor = layer.borderColor ? [UIColor colorWithCGColor:layer.borderColor] : [UIColor clearColor];
    _backgroundColor = layer.backgroundColor ? [UIColor colorWithCGColor:layer.backgroundColor] : [UIColor clearColor];
    _shadowColor = layer.shadowColor ? [UIColor colorWithCGColor:layer.shadowColor] : [UIColor clearColor];
    _shadowOffset = layer.shadowOffset;
    _shadowRadius = layer.shadowRadius;
    _shadowOpacity = layer.shadowOpacity;
    
    // On ABI47_0_0RN60 and beyond, certain styles are not immediately applied to the view/layer
    // when a borderWidth is set on the view. Therefore, as a fail-safe we also try to
    // get the props from the ABI47_0_0RCTView directly, when possible.
    if ([view isKindOfClass:[ABI47_0_0RCTView class]]) {
      ABI47_0_0RCTView* rctView = (ABI47_0_0RCTView*) view;
      _cornerRadii = [ABI47_0_0RNSharedElementStyle cornerRadiiFromABI47_0_0RCTView: rctView];
      _borderWidth = rctView.borderWidth >= 0.0f ? rctView.borderWidth : 0.0f;
      _backgroundColor = rctView.backgroundColor ? rctView.backgroundColor : [UIColor clearColor];
      
      // As of ABI47_0_0React-native 0.65, the borderColor type was changed from CGColorRef to UIColor*
      objc_property_t propertyType = class_getProperty([ABI47_0_0RCTView class], "borderColor");
      const char *propertyAttrs = property_getAttributes(propertyType);
      BOOL isUIColor = [[NSString stringWithUTF8String:propertyAttrs] containsString:@"UIColor"];
      _borderColor = rctView.borderColor ? (isUIColor ? (UIColor*) rctView.borderColor : [UIColor colorWithCGColor:(CGColorRef) rctView.borderColor]) : [UIColor clearColor];
      
    } else {
      _cornerRadii = [ABI47_0_0RNSharedElementCornerRadii new];
      [_cornerRadii setRadius:layer.cornerRadius corner:ABI47_0_0RNSharedElementCornerAll];
    }
  }
  
  return self;
}

+ (NSString*) stringFromTransform:(CATransform3D) transform {
  BOOL isAffine = CATransform3DIsAffine(transform);
  if (isAffine) {
    CGAffineTransform affine = CATransform3DGetAffineTransform(transform);
    return [NSString stringWithFormat:@"tx=%f, ty=%f, sx=%f, sy=%f, ro=%f",
            affine.tx, affine.ty, affine.a, affine.d, atan2f(affine.b, affine.a) * (180 / M_PI)];
  } else {
    return [NSString stringWithFormat:@"x=%f, y=%f, z=%f",
            transform.m41, transform.m42, transform.m43];
  }
}

+ (CATransform3D) getAbsoluteViewTransform:(UIView*) view
{
  CATransform3D transform = view.layer.transform;
  view = view.superview;
  while (view != nil) {
    transform = CATransform3DConcat(transform, view.layer.transform);
    view = view.superview;
  }
  return transform;
}

+ (UIColor*) getInterpolatedColor:(UIColor*)color1 color2:(UIColor*)color2 position:(CGFloat)position
{
  CGFloat red1, green1, blue1, alpha1;
  CGFloat red2, green2, blue2, alpha2;
  [color1 getRed:&red1 green:&green1 blue:&blue1 alpha:&alpha1];
  [color2 getRed:&red2 green:&green2 blue:&blue2 alpha:&alpha2];
  CGFloat alpha = alpha1 + ((alpha2 - alpha1) * position);
  CGFloat red = red1 + ((red2 - red1) * position);
  CGFloat green = green1 + ((green2 - green1) * position);
  CGFloat blue = blue1 + ((blue2 - blue1) * position);
  if ((alpha1 == 0.0f) && (alpha2 != 0.0f)) {
    red = red2;
    green = green2;
    blue = blue2;
  } else if ((alpha2 == 0.0f) && (alpha1 != 0.0f)) {
    red = red1;
    green = green1;
    blue = blue1;
  }
  return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}

+ (ABI47_0_0RNSharedElementStyle*) getInterpolatedStyle:(ABI47_0_0RNSharedElementStyle*)style1 style2:(ABI47_0_0RNSharedElementStyle*)style2 position:(CGFloat) position
{
  ABI47_0_0RNSharedElementStyle* style = [[ABI47_0_0RNSharedElementStyle alloc]init];
  style.opacity = style1.opacity + ((style2.opacity - style1.opacity) * position);
  
  CGRect radiiRect = CGRectMake(0, 0, 1000000, 1000000);
  ABI47_0_0RCTCornerRadii radii1 = [style1.cornerRadii radiiForBounds:radiiRect];
  ABI47_0_0RCTCornerRadii radii2 = [style2.cornerRadii radiiForBounds:radiiRect];
  [style.cornerRadii setRadius:radii1.topLeft + ((radii2.topLeft - radii1.topLeft) * position) corner:ABI47_0_0RNSharedElementCornerTopLeft];
  [style.cornerRadii setRadius:radii1.topRight + ((radii2.topRight - radii1.topRight) * position) corner:ABI47_0_0RNSharedElementCornerTopRight];
  [style.cornerRadii setRadius:radii1.bottomLeft + ((radii2.bottomLeft - radii1.bottomLeft) * position) corner:ABI47_0_0RNSharedElementCornerBottomLeft];
  [style.cornerRadii setRadius:radii1.bottomRight + ((radii2.bottomRight - radii1.bottomRight) * position) corner:ABI47_0_0RNSharedElementCornerBottomRight];
  
  style.borderWidth = style1.borderWidth + ((style2.borderWidth - style1.borderWidth) * position);
  style.borderColor = [ABI47_0_0RNSharedElementStyle getInterpolatedColor:style1.borderColor color2:style2.borderColor position:position];
  style.backgroundColor = [ABI47_0_0RNSharedElementStyle getInterpolatedColor:style1.backgroundColor color2:style2.backgroundColor position:position];
  style.shadowOpacity = style1.shadowOpacity + ((style2.shadowOpacity - style1.shadowOpacity) * position);
  style.shadowRadius = style1.shadowRadius + ((style2.shadowRadius - style1.shadowRadius) * position);
  style.shadowOffset = CGSizeMake(
                                  style1.shadowOffset.width + ((style2.shadowOffset.width - style1.shadowOffset.width) * position),
                                  style1.shadowOffset.height + ((style2.shadowOffset.height - style1.shadowOffset.height) * position)
                                  );
  style.shadowColor = [ABI47_0_0RNSharedElementStyle getInterpolatedColor:style1.shadowColor color2:style2.shadowColor position:position];
  return style;
}

+ (ABI47_0_0RNSharedElementCornerRadii *)cornerRadiiFromABI47_0_0RCTView:(ABI47_0_0RCTView *)rctView
{
  ABI47_0_0RNSharedElementCornerRadii *cornerRadii = [ABI47_0_0RNSharedElementCornerRadii new];
  [cornerRadii setRadius:[rctView borderRadius] corner:ABI47_0_0RNSharedElementCornerAll];
  [cornerRadii setRadius:[rctView borderTopLeftRadius] corner:ABI47_0_0RNSharedElementCornerTopLeft];
  [cornerRadii setRadius:[rctView borderTopRightRadius] corner:ABI47_0_0RNSharedElementCornerTopRight];
  [cornerRadii setRadius:[rctView borderTopStartRadius] corner:ABI47_0_0RNSharedElementCornerTopStart];
  [cornerRadii setRadius:[rctView borderTopEndRadius] corner:ABI47_0_0RNSharedElementCornerTopEnd];
  [cornerRadii setRadius:[rctView borderBottomLeftRadius] corner:ABI47_0_0RNSharedElementCornerBottomLeft];
  [cornerRadii setRadius:[rctView borderBottomRightRadius] corner:ABI47_0_0RNSharedElementCornerBottomRight];
  [cornerRadii setRadius:[rctView borderBottomStartRadius] corner:ABI47_0_0RNSharedElementCornerBottomStart];
  [cornerRadii setRadius:[rctView borderBottomEndRadius] corner:ABI47_0_0RNSharedElementCornerBottomEnd];
  [cornerRadii setLayoutDirection:[rctView ABI47_0_0ReactLayoutDirection]];
  return cornerRadii;
}

@end
