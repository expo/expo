/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGUse.h"
#import <React/RCTLog.h>
#import "RNSVGSymbol.h"

#ifdef RN_FABRIC_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation RNSVGUse

#ifdef RN_FABRIC_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGUseProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGUseComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const RNSVGUseProps>(props);

  self.x = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.x)];
  self.y = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.y)];
  if (RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.useheight = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.height)];
  }
  if (RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.usewidth = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.width)];
  }
  self.href = RCTNSStringFromStringNilIfEmpty(newProps.href);

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGUseProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _x = nil;
  _y = nil;
  _useheight = nil;
  _usewidth = nil;
  _href = nil;
}
#endif // RN_FABRIC_ENABLED

- (void)setHref:(NSString *)href
{
  if ([href isEqualToString:_href]) {
    return;
  }

  [self invalidate];
  _href = href;
}

- (void)setX:(RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }

  [self invalidate];
  _x = x;
}

- (void)setY:(RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }

  [self invalidate];
  _y = y;
}

- (void)setUsewidth:(RNSVGLength *)usewidth
{
  if ([usewidth isEqualTo:_usewidth]) {
    return;
  }

  [self invalidate];
  _usewidth = usewidth;
}

- (void)setUseheight:(RNSVGLength *)useheight
{
  if ([useheight isEqualTo:_useheight]) {
    return;
  }

  [self invalidate];
  _useheight = useheight;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
  CGContextTranslateCTM(context, [self relativeOnWidth:self.x], [self relativeOnHeight:self.y]);
  RNSVGNode *definedTemplate = [self.svgView getDefinedTemplate:self.href];
  if (definedTemplate) {
    [self beginTransparencyLayer:context];
    [self clip:context];

    if ([definedTemplate isKindOfClass:[RNSVGRenderable class]]) {
      [(RNSVGRenderable *)definedTemplate mergeProperties:self];
    }

    if ([definedTemplate class] == [RNSVGSymbol class]) {
      RNSVGSymbol *symbol = (RNSVGSymbol *)definedTemplate;
      [symbol renderSymbolTo:context
                       width:[self relativeOnWidth:self.usewidth]
                      height:[self relativeOnHeight:self.useheight]];
    } else {
      [definedTemplate renderTo:context rect:rect];
    }

    if ([definedTemplate isKindOfClass:[RNSVGRenderable class]]) {
      [(RNSVGRenderable *)definedTemplate resetProperties];
    }

    [self endTransparencyLayer:context];
  } else if (self.href) {
    // TODO: calling yellow box here
    RCTLogWarn(
        @"`Use` element expected a pre-defined svg template as `href` prop, template named: %@ is not defined.",
        self.href);
    return;
  } else {
    return;
  }
  CGRect bounds = definedTemplate.clientRect;
  self.clientRect = bounds;

  CGAffineTransform current = CGContextGetCTM(context);
  CGAffineTransform svgToClientTransform = CGAffineTransformConcat(current, self.svgView.invInitialCTM);

  self.ctm = svgToClientTransform;
  self.screenCTM = current;

  CGAffineTransform transform = CGAffineTransformConcat(self.matrix, self.transforms);
  CGPoint mid = CGPointMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds));
  CGPoint center = CGPointApplyAffineTransform(mid, transform);

  self.bounds = bounds;
  if (!isnan(center.x) && !isnan(center.y)) {
    self.center = center;
  }
  self.frame = bounds;
}

- (RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  CGPoint transformed = CGPointApplyAffineTransform(point, self.invmatrix);
  transformed = CGPointApplyAffineTransform(transformed, self.invTransform);
  RNSVGNode const *definedTemplate = [self.svgView getDefinedTemplate:self.href];
  if (event) {
    self.active = NO;
  } else if (self.active) {
    return self;
  }
  RNSVGPlatformView const *hitChild = [definedTemplate hitTest:transformed withEvent:event];
  if (hitChild) {
    self.active = YES;
    return self;
  }
  return nil;
}

- (CGPathRef)getPath:(CGContextRef)context
{
  CGAffineTransform transform =
      CGAffineTransformMakeTranslation([self relativeOnWidth:self.x], [self relativeOnHeight:self.y]);
  RNSVGNode const *definedTemplate = [self.svgView getDefinedTemplate:self.href];
  if (!definedTemplate) {
    return nil;
  }
  CGPathRef path = [definedTemplate getPath:context];
  return CGPathCreateCopyByTransformingPath(path, &transform);
}

@end

#ifdef RN_FABRIC_ENABLED
Class<RCTComponentViewProtocol> RNSVGUseCls(void)
{
  return RNSVGUse.class;
}
#endif // RN_FABRIC_ENABLED
