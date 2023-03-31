/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGGroup.h"
#import "ABI48_0_0RNSVGClipPath.h"
#import "ABI48_0_0RNSVGMask.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGGroup {
  ABI48_0_0RNSVGGlyphContext *_glyphContext;
}

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGGroupProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGGroupComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGGroupProps>(props);

  setCommonGroupProps(newProps, self);
  _props = std::static_pointer_cast<ABI48_0_0RNSVGGroupProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _font = nil;
  _glyphContext = nil;
}
#endif // RN_FABRIC_ENABLED

- (void)setFont:(NSDictionary *)font
{
  if (font == _font) {
    return;
  }

  [self invalidate];
  _font = font;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
  [self clip:context];
  [self setupGlyphContext:context];
  [self renderGroupTo:context rect:rect];
}

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
  [self pushGlyphContext];

  __block CGRect bounds = CGRectNull;

  [self traverseSubviews:^(ABI48_0_0RNSVGView *node) {
    if ([node isKindOfClass:[ABI48_0_0RNSVGMask class]] || [node isKindOfClass:[ABI48_0_0RNSVGClipPath class]]) {
      // no-op
    } else if ([node isKindOfClass:[ABI48_0_0RNSVGNode class]]) {
      ABI48_0_0RNSVGNode *svgNode = (ABI48_0_0RNSVGNode *)node;
      if (svgNode.display && [@"none" isEqualToString:svgNode.display]) {
        return YES;
      }
      if (svgNode.responsible && !self.svgView.responsible) {
        self.svgView.responsible = YES;
      }

      if ([node isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
        [(ABI48_0_0RNSVGRenderable *)node mergeProperties:self];
      }

      [svgNode renderTo:context rect:rect];

      CGRect nodeRect = svgNode.clientRect;
      if (!CGRectIsEmpty(nodeRect)) {
        bounds = CGRectUnion(bounds, nodeRect);
      }

      if ([node isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
        [(ABI48_0_0RNSVGRenderable *)node resetProperties];
      }
    } else if ([node isKindOfClass:[ABI48_0_0RNSVGSvgView class]]) {
      ABI48_0_0RNSVGSvgView *svgView = (ABI48_0_0RNSVGSvgView *)node;
      CGFloat width = [self relativeOnWidth:svgView.bbWidth];
      CGFloat height = [self relativeOnHeight:svgView.bbHeight];
      CGRect rect = CGRectMake(0, 0, width, height);
      CGContextClipToRect(context, rect);
      [svgView drawToContext:context withRect:rect];
    } else {
      [node drawRect:rect];
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

- (void)setupGlyphContext:(CGContextRef)context
{
  CGRect clipBounds = CGContextGetClipBoundingBox(context);
  clipBounds = CGRectApplyAffineTransform(clipBounds, self.matrix);
  clipBounds = CGRectApplyAffineTransform(clipBounds, self.transforms);
  CGFloat width = CGRectGetWidth(clipBounds);
  CGFloat height = CGRectGetHeight(clipBounds);

  _glyphContext = [[ABI48_0_0RNSVGGlyphContext alloc] initWithWidth:width height:height];
}

- (ABI48_0_0RNSVGGlyphContext *)getGlyphContext
{
  return _glyphContext;
}

- (void)pushGlyphContext
{
  __typeof__(self) __weak weakSelf = self;
  [[self.textRoot getGlyphContext] pushContext:weakSelf font:self.font];
}

- (void)popGlyphContext
{
  [[self.textRoot getGlyphContext] popContext];
}

- (void)renderPathTo:(CGContextRef)context rect:(CGRect)rect
{
  [super renderLayerTo:context rect:rect];
}

- (CGPathRef)getPath:(CGContextRef)context
{
  CGPathRef cached = self.path;
  if (cached) {
    return cached;
  }
  CGMutablePathRef __block path = CGPathCreateMutable();
  [self traverseSubviews:^(ABI48_0_0RNSVGNode *node) {
    if ([node isKindOfClass:[ABI48_0_0RNSVGNode class]] && ![node isKindOfClass:[ABI48_0_0RNSVGMask class]]) {
      CGAffineTransform transform = CGAffineTransformConcat(node.matrix, node.transforms);
      CGPathAddPath(path, &transform, [node getPath:context]);
      CGPathAddPath(path, &transform, [node markerPath]);
      node.dirty = false;
    }
    return YES;
  }];

  cached = CGPathRetain((CGPathRef)CFAutorelease(path));
  self.path = cached;
  return cached;
}

- (ABI48_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  CGPoint transformed = CGPointApplyAffineTransform(point, self.invmatrix);
  transformed = CGPointApplyAffineTransform(transformed, self.invTransform);

  if (!CGRectContainsPoint(self.pathBounds, transformed)) {
    return nil;
  }

  if (self.clipPath) {
    ABI48_0_0RNSVGClipPath *clipNode = (ABI48_0_0RNSVGClipPath *)[self.svgView getDefinedClipPath:self.clipPath];
    if ([clipNode isSimpleClipPath]) {
      CGPathRef clipPath = [self getClipPath];
      if (clipPath && !CGPathContainsPoint(clipPath, nil, transformed, clipNode.clipRule == kRNSVGCGFCRuleEvenodd)) {
        return nil;
      }
    } else {
      ABI48_0_0RNSVGRenderable *clipGroup = (ABI48_0_0RNSVGRenderable *)clipNode;
      if (![clipGroup hitTest:transformed withEvent:event]) {
        return nil;
      }
    }
  }

  if (!event) {
    NSPredicate *const anyActive =
        [NSPredicate predicateWithFormat:@"self isKindOfClass: %@ AND active == TRUE", [ABI48_0_0RNSVGNode class]];
    NSArray *const filtered = [self.subviews filteredArrayUsingPredicate:anyActive];
    if ([filtered count] != 0) {
      return [filtered.lastObject hitTest:transformed withEvent:event];
    }
  }

  for (ABI48_0_0RNSVGView *node in [self.subviews reverseObjectEnumerator]) {
    if ([node isKindOfClass:[ABI48_0_0RNSVGNode class]]) {
      if ([node isKindOfClass:[ABI48_0_0RNSVGMask class]]) {
        continue;
      }
      ABI48_0_0RNSVGNode *svgNode = (ABI48_0_0RNSVGNode *)node;
      if (event) {
        svgNode.active = NO;
      }
      ABI48_0_0RNSVGPlatformView *hitChild = [svgNode hitTest:transformed withEvent:event];
      if (hitChild) {
        svgNode.active = YES;
        return (svgNode.responsible || (svgNode != hitChild)) ? hitChild : self;
      }
    } else if ([node isKindOfClass:[ABI48_0_0RNSVGSvgView class]]) {
      ABI48_0_0RNSVGSvgView *svgView = (ABI48_0_0RNSVGSvgView *)node;
      ABI48_0_0RNSVGPlatformView *hitChild = [svgView hitTest:transformed withEvent:event];
      if (hitChild) {
        return hitChild;
      }
    }
  }

  ABI48_0_0RNSVGPlatformView *hitSelf = [super hitTest:transformed withEvent:event];
  if (hitSelf) {
    return hitSelf;
  }

  return nil;
}

- (void)parseReference
{
  self.dirty = false;
  if (self.name) {
    __typeof__(self) __weak weakSelf = self;
    [self.svgView defineTemplate:weakSelf templateName:self.name];
  }

  [self traverseSubviews:^(ABI48_0_0RNSVGNode *node) {
    if ([node isKindOfClass:[ABI48_0_0RNSVGNode class]]) {
      [node parseReference];
    }
    return YES;
  }];
}

- (void)resetProperties
{
  [self traverseSubviews:^(__kindof ABI48_0_0RNSVGNode *node) {
    if ([node isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
      [(ABI48_0_0RNSVGRenderable *)node resetProperties];
    }
    return YES;
  }];
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGGroupCls(void)
{
  return ABI48_0_0RNSVGGroup.class;
}
#endif // RN_FABRIC_ENABLED
