/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGForeignObject.h"
#import "RNSVGClipPath.h"
#import "RNSVGMask.h"
#import "RNSVGNode.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RCT_NEW_ARCH_ENABLED

@implementation RNSVGForeignObject

#ifdef RCT_NEW_ARCH_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGForeignObjectProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGForeignObjectComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const RNSVGForeignObjectProps>(props);

  self.x = RCTNSStringFromStringNilIfEmpty(newProps.x)
      ? [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.x)]
      : nil;
  self.y = RCTNSStringFromStringNilIfEmpty(newProps.y)
      ? [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.y)]
      : nil;
  if (RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.foreignObjectheight = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.height)];
  }
  if (RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.foreignObjectwidth = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.width)];
  }

  setCommonGroupProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGForeignObjectProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _x = nil;
  _y = nil;
  _foreignObjectheight = nil;
  _foreignObjectwidth = nil;
}
#endif // RCT_NEW_ARCH_ENABLED
- (RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

- (void)parseReference
{
  self.dirty = false;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
  [self clip:context];
  CGContextTranslateCTM(context, [self relativeOnWidth:self.x], [self relativeOnHeight:self.y]);
  CGRect clip = CGRectMake(
      0, 0, [self relativeOnWidth:self.foreignObjectwidth], [self relativeOnHeight:self.foreignObjectheight]);
  CGContextClipToRect(context, clip);
  [super renderLayerTo:context rect:rect];
}

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
  [self pushGlyphContext];

  __block CGRect bounds = CGRectNull;

  [self traverseSubviews:^(RNSVGView *node) {
    if ([node isKindOfClass:[RNSVGMask class]] || [node isKindOfClass:[RNSVGClipPath class]]) {
      // no-op
    } else if ([node isKindOfClass:[RNSVGNode class]]) {
      RNSVGNode *svgNode = (RNSVGNode *)node;
      if (svgNode.display && [@"none" isEqualToString:svgNode.display]) {
        return YES;
      }
      if (svgNode.responsible && !self.svgView.responsible) {
        self.svgView.responsible = YES;
      }

      if ([node isKindOfClass:[RNSVGRenderable class]]) {
        [(RNSVGRenderable *)node mergeProperties:self];
      }

      [svgNode renderTo:context rect:rect];

      CGRect nodeRect = svgNode.clientRect;
      if (!CGRectIsEmpty(nodeRect)) {
        bounds = CGRectUnion(bounds, nodeRect);
      }

      if ([node isKindOfClass:[RNSVGRenderable class]]) {
        [(RNSVGRenderable *)node resetProperties];
      }
    } else if ([node isKindOfClass:[RNSVGSvgView class]]) {
      RNSVGSvgView *svgView = (RNSVGSvgView *)node;
      CGFloat width = [self relativeOnWidth:svgView.bbWidth];
      CGFloat height = [self relativeOnHeight:svgView.bbHeight];
      CGRect rect = CGRectMake(0, 0, width, height);
      CGContextClipToRect(context, rect);
      [svgView drawToContext:context withRect:rect];
    } else {
      node.hidden = false;
      [node.layer renderInContext:context];
      node.hidden = true;
    }

    return YES;
  }];
  CGPathRef path = [self getPath:context];
  [self setHitArea:path];
  if (!CGRectEqualToRect(bounds, CGRectNull)) {
    self.clientRect = bounds;
    self.fillBounds = CGPathGetBoundingBox(path);
    self.strokeBounds = CGPathGetBoundingBox(self.strokePath);
    self.pathBounds = CGRectUnion(self.fillBounds, self.strokeBounds);

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

  [self popGlyphContext];
}

- (void)drawRect:(CGRect)rect
{
  [self invalidate];
}

- (void)setX:(RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }

  _x = x;
  [self invalidate];
}

- (void)setY:(RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }

  _y = y;
  [self invalidate];
}

- (void)setForeignObjectwidth:(RNSVGLength *)foreignObjectwidth
{
  if ([foreignObjectwidth isEqualTo:_foreignObjectwidth]) {
    return;
  }

  _foreignObjectwidth = foreignObjectwidth;
  [self invalidate];
}

- (void)setForeignObjectheight:(RNSVGLength *)foreignObjectheight
{
  if ([foreignObjectheight isEqualTo:_foreignObjectheight]) {
    return;
  }

  _foreignObjectheight = foreignObjectheight;
  [self invalidate];
}

@end

#ifdef RCT_NEW_ARCH_ENABLED
Class<RCTComponentViewProtocol> RNSVGForeignObjectCls(void)
{
  return RNSVGForeignObject.class;
}
#endif // RCT_NEW_ARCH_ENABLED
