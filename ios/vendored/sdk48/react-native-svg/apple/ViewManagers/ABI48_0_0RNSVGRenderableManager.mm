/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGRenderableManager.h"
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManagerUtils.h>
#import "ABI48_0_0RNSVGPathMeasure.h"

#import "ABI48_0_0RCTConvert+RNSVG.h"
#import "ABI48_0_0RNSVGCGFCRule.h"

@implementation ABI48_0_0RNSVGRenderableManager

ABI48_0_0RCT_EXPORT_MODULE()

- (ABI48_0_0RNSVGRenderable *)node
{
  return [ABI48_0_0RNSVGRenderable new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fill, ABI48_0_0RNSVGBrush)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fillRule, ABI48_0_0RNSVGCGFCRule)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(stroke, ABI48_0_0RNSVGBrush)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, ABI48_0_0RNSVGLength *)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<ABI48_0_0RNSVGLength *>)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(vectorEffect, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isPointInFill : (nonnull NSNumber *)ABI48_0_0ReactTag options : (NSDictionary *)options)
{
  ABI48_0_0RNSVGPlatformView *view = [self getRenderableView:ABI48_0_0ReactTag];

  if (![view isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
    ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGRenderable, got: %@", view);
    return [NSNumber numberWithBool:false];
  }
  if (options == nil) {
    ABI48_0_0RCTLogError(@"Invalid options given to isPointInFill, got: %@", options);
    return [NSNumber numberWithBool:false];
  }
  id xo = [options objectForKey:@"x"];
  id yo = [options objectForKey:@"y"];
  if (![xo isKindOfClass:NSNumber.class] || ![yo isKindOfClass:NSNumber.class]) {
    ABI48_0_0RCTLogError(@"Invalid x or y given to isPointInFill");
    return [NSNumber numberWithBool:false];
  }
  ABI48_0_0RNSVGRenderable *svg = (ABI48_0_0RNSVGRenderable *)view;
  CGFloat x = (CGFloat)[xo doubleValue];
  CGFloat y = (CGFloat)[yo doubleValue];
  CGPoint point = CGPointMake(x, y);
  ABI48_0_0RNSVGPlatformView *target = [svg hitTest:point withEvent:nil];
  BOOL hit = target != nil;
  return [NSNumber numberWithBool:hit];
}

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isPointInStroke : (nonnull NSNumber *)ABI48_0_0ReactTag options : (NSDictionary *)options)
{
  ABI48_0_0RNSVGPlatformView *view = [self getRenderableView:ABI48_0_0ReactTag];

  if (![view isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
    ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGRenderable, got: %@", view);
    return [NSNumber numberWithBool:false];
  }
  if (options == nil) {
    ABI48_0_0RCTLogError(@"Invalid options given to isPointInFill, got: %@", options);
    return [NSNumber numberWithBool:false];
  }
  id xo = [options objectForKey:@"x"];
  id yo = [options objectForKey:@"y"];
  if (![xo isKindOfClass:NSNumber.class] || ![yo isKindOfClass:NSNumber.class]) {
    ABI48_0_0RCTLogError(@"Invalid x or y given to isPointInFill");
    return [NSNumber numberWithBool:false];
  }
  ABI48_0_0RNSVGRenderable *svg = (ABI48_0_0RNSVGRenderable *)view;
  CGFloat x = (CGFloat)[xo doubleValue];
  CGFloat y = (CGFloat)[yo doubleValue];
  CGPoint point = CGPointMake(x, y);
  BOOL hit = CGPathContainsPoint(svg.strokePath, nil, point, NO);

  return [NSNumber numberWithBool:hit];
}

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getTotalLength : (nonnull NSNumber *)ABI48_0_0ReactTag)
{
  ABI48_0_0RNSVGPlatformView *view = [self getRenderableView:ABI48_0_0ReactTag];

  if (![view isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
    ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGRenderable, got: %@", view);
    return [NSNumber numberWithDouble:0];
  }

  ABI48_0_0RNSVGPathMeasure *measure = [[ABI48_0_0RNSVGPathMeasure alloc] init];
  ABI48_0_0RNSVGRenderable *svg = (ABI48_0_0RNSVGRenderable *)view;
  CGPathRef target = [svg getPath:nil];
  [measure extractPathData:target];

  return [NSNumber numberWithDouble:measure.pathLength];
}

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getPointAtLength
                                       : (nonnull NSNumber *)ABI48_0_0ReactTag options
                                       : (NSDictionary *)options)
{
  ABI48_0_0RNSVGPlatformView *view = [self getRenderableView:ABI48_0_0ReactTag];

  if (![view isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
    ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGRenderable, got: %@", view);
    return nil;
  }

  CGFloat position = (CGFloat)[[options objectForKey:@"length"] doubleValue];
  ABI48_0_0RNSVGPathMeasure *measure = [[ABI48_0_0RNSVGPathMeasure alloc] init];
  ABI48_0_0RNSVGRenderable *svg = (ABI48_0_0RNSVGRenderable *)view;
  CGPathRef target = [svg getPath:nil];
  [measure extractPathData:target];

  CGFloat x;
  CGFloat y;
  CGFloat angle;
  double midPoint = fmax(0, fmin(position, measure.pathLength));
  [measure getPosAndTan:&angle midPoint:midPoint x:&x y:&y];

  return @{@"x" : @(x), @"y" : @(y), @"angle" : @(angle)};
}

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getBBox : (nonnull NSNumber *)ABI48_0_0ReactTag options : (NSDictionary *)options)
{
  ABI48_0_0RNSVGPlatformView *view = [self getRenderableView:ABI48_0_0ReactTag];

  if (![view isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
    ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGRenderable, got: %@", view);
    return nil;
  }

  ABI48_0_0RNSVGRenderable *svg = (ABI48_0_0RNSVGRenderable *)view;
  BOOL fill = [[options objectForKey:@"fill"] boolValue];
  BOOL stroke = [[options objectForKey:@"stroke"] boolValue];
  BOOL markers = [[options objectForKey:@"markers"] boolValue];
  BOOL clipped = [[options objectForKey:@"clipped"] boolValue];
  [svg getPath:nil];

  CGRect bounds = CGRectZero;
  if (fill) {
    bounds = CGRectUnion(bounds, svg.fillBounds);
  }
  if (stroke) {
    bounds = CGRectUnion(bounds, svg.strokeBounds);
  }
  if (markers) {
    bounds = CGRectUnion(bounds, svg.markerBounds);
  }
  if (clipped) {
    CGPathRef clipPath = [svg getClipPath];
    CGRect clipBounds = CGPathGetBoundingBox(clipPath);
    if (clipPath && !CGRectIsEmpty(clipBounds)) {
      bounds = CGRectIntersection(bounds, clipBounds);
    }
  }

  CGPoint origin = bounds.origin;
  CGSize size = bounds.size;
  return @{@"x" : @(origin.x), @"y" : @(origin.y), @"width" : @(size.width), @"height" : @(size.height)};
}

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getCTM : (nonnull NSNumber *)ABI48_0_0ReactTag)
{
  ABI48_0_0RNSVGPlatformView *view = [self getRenderableView:ABI48_0_0ReactTag];

  if (![view isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
    ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGRenderable, got: %@", view);
    return nil;
  }

  ABI48_0_0RNSVGRenderable *svg = (ABI48_0_0RNSVGRenderable *)view;
  CGAffineTransform ctm = svg.ctm;
  return @{@"a" : @(ctm.a), @"b" : @(ctm.b), @"c" : @(ctm.c), @"d" : @(ctm.d), @"e" : @(ctm.tx), @"f" : @(ctm.ty)};
}

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getScreenCTM : (nonnull NSNumber *)ABI48_0_0ReactTag)
{
  ABI48_0_0RNSVGPlatformView *view = [self getRenderableView:ABI48_0_0ReactTag];

  if (![view isKindOfClass:[ABI48_0_0RNSVGRenderable class]]) {
    ABI48_0_0RCTLogError(@"Invalid svg returned from registry, expecting ABI48_0_0RNSVGRenderable, got: %@", view);
    return nil;
  }

  ABI48_0_0RNSVGRenderable *svg = (ABI48_0_0RNSVGRenderable *)view;
  CGAffineTransform ctm = svg.ctm;
  return @{@"a" : @(ctm.a), @"b" : @(ctm.b), @"c" : @(ctm.c), @"d" : @(ctm.d), @"e" : @(ctm.tx), @"f" : @(ctm.ty)};
}

- (ABI48_0_0RNSVGPlatformView *)getRenderableView:(NSNumber *)ABI48_0_0ReactTag
{
  __block ABI48_0_0RNSVGPlatformView *view;
  dispatch_sync(dispatch_get_main_queue(), ^{
    view = [self.bridge.uiManager viewForABI48_0_0ReactTag:ABI48_0_0ReactTag];
  });
  return view;
}

@end
