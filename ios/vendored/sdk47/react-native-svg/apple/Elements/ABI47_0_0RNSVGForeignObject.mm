/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI47_0_0RNSVGForeignObject.h"
#import "ABI47_0_0RNSVGClipPath.h"
#import "ABI47_0_0RNSVGMask.h"
#import "ABI47_0_0RNSVGNode.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI47_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI47_0_0RNSVGForeignObject

#ifdef RN_FABRIC_ENABLED
using namespace ABI47_0_0facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI47_0_0RNSVGForeignObjectProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI47_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI47_0_0RNSVGForeignObjectComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI47_0_0RNSVGForeignObjectProps>(props);

  self.x = ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.x)
      ? [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.x)]
      : nil;
  self.y = ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.y)
      ? [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.y)]
      : nil;
  if (ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.foreignObjectheight = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.height)];
  }
  if (ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.foreignObjectwidth = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.width)];
  }

  setCommonGroupProps(newProps, self);
  _props = std::static_pointer_cast<ABI47_0_0RNSVGForeignObjectProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _x = nil;
  _y = nil;
  _foreignObjectheight = nil;
  _foreignObjectwidth = nil;
}
#endif // RN_FABRIC_ENABLED
- (ABI47_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
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

  [self traverseSubviews:^(ABI47_0_0RNSVGView *node) {
    if ([node isKindOfClass:[ABI47_0_0RNSVGMask class]] || [node isKindOfClass:[ABI47_0_0RNSVGClipPath class]]) {
      // no-op
    } else if ([node isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
      ABI47_0_0RNSVGNode *svgNode = (ABI47_0_0RNSVGNode *)node;
      if (svgNode.display && [@"none" isEqualToString:svgNode.display]) {
        return YES;
      }
      if (svgNode.responsible && !self.svgView.responsible) {
        self.svgView.responsible = YES;
      }

      if ([node isKindOfClass:[ABI47_0_0RNSVGRenderable class]]) {
        [(ABI47_0_0RNSVGRenderable *)node mergeProperties:self];
      }

      [svgNode renderTo:context rect:rect];

      CGRect nodeRect = svgNode.clientRect;
      if (!CGRectIsEmpty(nodeRect)) {
        bounds = CGRectUnion(bounds, nodeRect);
      }

      if ([node isKindOfClass:[ABI47_0_0RNSVGRenderable class]]) {
        [(ABI47_0_0RNSVGRenderable *)node resetProperties];
      }
    } else if ([node isKindOfClass:[ABI47_0_0RNSVGSvgView class]]) {
      ABI47_0_0RNSVGSvgView *svgView = (ABI47_0_0RNSVGSvgView *)node;
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

- (void)setX:(ABI47_0_0RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }

  _x = x;
  [self invalidate];
}

- (void)setY:(ABI47_0_0RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }

  _y = y;
  [self invalidate];
}

- (void)setForeignObjectwidth:(ABI47_0_0RNSVGLength *)foreignObjectwidth
{
  if ([foreignObjectwidth isEqualTo:_foreignObjectwidth]) {
    return;
  }

  _foreignObjectwidth = foreignObjectwidth;
  [self invalidate];
}

- (void)setForeignObjectheight:(ABI47_0_0RNSVGLength *)foreignObjectheight
{
  if ([foreignObjectheight isEqualTo:_foreignObjectheight]) {
    return;
  }

  _foreignObjectheight = foreignObjectheight;
  [self invalidate];
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSVGForeignObjectCls(void)
{
  return ABI47_0_0RNSVGForeignObject.class;
}
#endif // RN_FABRIC_ENABLED
