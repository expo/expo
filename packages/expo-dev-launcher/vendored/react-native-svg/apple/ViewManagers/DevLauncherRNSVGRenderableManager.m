/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import "DevLauncherRNSVGRenderableManager.h"
#import "DevLauncherRNSVGPathMeasure.h"

#import "RCTConvert+DevLauncherRNSVG.h"
#import "DevLauncherRNSVGCGFCRule.h"

@implementation DevLauncherRNSVGRenderableManager

- (DevLauncherRNSVGRenderable *)node
{
    return [DevLauncherRNSVGRenderable new];
}

RCT_EXPORT_VIEW_PROPERTY(fill, DevLauncherRNSVGBrush)
RCT_EXPORT_VIEW_PROPERTY(fillOpacity, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(fillRule, DevLauncherRNSVGCGFCRule)
RCT_EXPORT_VIEW_PROPERTY(stroke, DevLauncherRNSVGBrush)
RCT_EXPORT_VIEW_PROPERTY(strokeOpacity, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(strokeWidth, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(strokeLinecap, CGLineCap)
RCT_EXPORT_VIEW_PROPERTY(strokeLinejoin, CGLineJoin)
RCT_EXPORT_VIEW_PROPERTY(strokeDasharray, NSArray<DevLauncherRNSVGLength *>)
RCT_EXPORT_VIEW_PROPERTY(strokeDashoffset, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(strokeMiterlimit, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(vectorEffect, int)
RCT_EXPORT_VIEW_PROPERTY(propList, NSArray<NSString *>)

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isPointInFill:(nonnull NSNumber *)reactTag options:(NSDictionary *)options)
{
    __block DevLauncherRNSVGPlatformView *view;
    dispatch_sync(dispatch_get_main_queue(), ^{
        view = [self.bridge.uiManager viewForReactTag:reactTag];
    });
    if (![view isKindOfClass:[DevLauncherRNSVGRenderable class]]) {
        RCTLogError(@"Invalid svg returned from registry, expecting DevLauncherRNSVGRenderable, got: %@", view);
        return [NSNumber numberWithBool:false];
    }
    if (options == nil) {
        RCTLogError(@"Invalid options given to isPointInFill, got: %@", options);
        return [NSNumber numberWithBool:false];
    }
    id xo = [options objectForKey:@"x"];
    id yo = [options objectForKey:@"y"];
    if (![xo isKindOfClass:NSNumber.class] ||
        ![yo isKindOfClass:NSNumber.class]) {
        RCTLogError(@"Invalid x or y given to isPointInFill");
        return [NSNumber numberWithBool:false];
    }
    DevLauncherRNSVGRenderable *svg = (DevLauncherRNSVGRenderable *)view;
    CGFloat x = (CGFloat)[xo doubleValue];
    CGFloat y = (CGFloat)[yo doubleValue];
    CGPoint point = CGPointMake(x, y);
    DevLauncherRNSVGPlatformView *target = [svg hitTest:point withEvent:nil];
    BOOL hit = target != nil;
    return [NSNumber numberWithBool:hit];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isPointInStroke:(nonnull NSNumber *)reactTag options:(NSDictionary *)options)
{
    __block DevLauncherRNSVGPlatformView *view;
    dispatch_sync(dispatch_get_main_queue(), ^{
        view = [self.bridge.uiManager viewForReactTag:reactTag];
    });
    if (![view isKindOfClass:[DevLauncherRNSVGRenderable class]]) {
        RCTLogError(@"Invalid svg returned from registry, expecting DevLauncherRNSVGRenderable, got: %@", view);
        return [NSNumber numberWithBool:false];
    }
    if (options == nil) {
        RCTLogError(@"Invalid options given to isPointInFill, got: %@", options);
        return [NSNumber numberWithBool:false];
    }
    id xo = [options objectForKey:@"x"];
    id yo = [options objectForKey:@"y"];
    if (![xo isKindOfClass:NSNumber.class] ||
        ![yo isKindOfClass:NSNumber.class]) {
        RCTLogError(@"Invalid x or y given to isPointInFill");
        return [NSNumber numberWithBool:false];
    }
    DevLauncherRNSVGRenderable *svg = (DevLauncherRNSVGRenderable *)view;
    CGFloat x = (CGFloat)[xo doubleValue];
    CGFloat y = (CGFloat)[yo doubleValue];
    CGPoint point = CGPointMake(x, y);
    BOOL hit = CGPathContainsPoint(svg.strokePath, nil, point, NO);

    return [NSNumber numberWithBool:hit];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getTotalLength:(nonnull NSNumber *)reactTag)
{
    __block DevLauncherRNSVGPlatformView *view;
    dispatch_sync(dispatch_get_main_queue(), ^{
        view = [self.bridge.uiManager viewForReactTag:reactTag];
    });
    if (![view isKindOfClass:[DevLauncherRNSVGRenderable class]]) {
        RCTLogError(@"Invalid svg returned from registry, expecting DevLauncherRNSVGRenderable, got: %@", view);
        return [NSNumber numberWithDouble:0];
    }

    DevLauncherRNSVGPathMeasure *measure = [[DevLauncherRNSVGPathMeasure alloc]init];
    DevLauncherRNSVGRenderable *svg = (DevLauncherRNSVGRenderable *)view;
    CGPathRef target = [svg getPath:nil];
    [measure extractPathData:target];

    return [NSNumber numberWithDouble:measure.pathLength];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getPointAtLength:(nonnull NSNumber *)reactTag options:(NSDictionary *)options)
{
    __block DevLauncherRNSVGPlatformView *view;
    dispatch_sync(dispatch_get_main_queue(), ^{
        view = [self.bridge.uiManager viewForReactTag:reactTag];
    });
    if (![view isKindOfClass:[DevLauncherRNSVGRenderable class]]) {
        RCTLogError(@"Invalid svg returned from registry, expecting DevLauncherRNSVGRenderable, got: %@", view);
        return nil;
    }

    CGFloat position = (CGFloat)[[options objectForKey:@"length"] doubleValue];
    DevLauncherRNSVGPathMeasure *measure = [[DevLauncherRNSVGPathMeasure alloc]init];
    DevLauncherRNSVGRenderable *svg = (DevLauncherRNSVGRenderable *)view;
    CGPathRef target = [svg getPath:nil];
    [measure extractPathData:target];

    CGFloat x;
    CGFloat y;
    CGFloat angle;
    double midPoint = fmax(0, fmin(position, measure.pathLength));
    [measure getPosAndTan:&angle midPoint:midPoint x:&x y:&y];

    return @{
             @"x":@(x),
             @"y":@(y),
             @"angle":@(angle)
             };
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getBBox:(nonnull NSNumber *)reactTag options:(NSDictionary *)options)
{
    __block DevLauncherRNSVGPlatformView *view;
    dispatch_sync(dispatch_get_main_queue(), ^{
        view = [self.bridge.uiManager viewForReactTag:reactTag];
    });
    if (![view isKindOfClass:[DevLauncherRNSVGRenderable class]]) {
        RCTLogError(@"Invalid svg returned from registry, expecting DevLauncherRNSVGRenderable, got: %@", view);
        return nil;
    }

    DevLauncherRNSVGRenderable *svg = (DevLauncherRNSVGRenderable *)view;
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
    return @{
             @"x":@(origin.x),
             @"y":@(origin.y),
             @"width":@(size.width),
             @"height":@(size.height)
             };
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getCTM:(nonnull NSNumber *)reactTag)
{
    __block DevLauncherRNSVGPlatformView *view;
    dispatch_sync(dispatch_get_main_queue(), ^{
        view = [self.bridge.uiManager viewForReactTag:reactTag];
    });
    if (![view isKindOfClass:[DevLauncherRNSVGRenderable class]]) {
        RCTLogError(@"Invalid svg returned from registry, expecting DevLauncherRNSVGRenderable, got: %@", view);
        return nil;
    }

    DevLauncherRNSVGRenderable *svg = (DevLauncherRNSVGRenderable *)view;
    CGAffineTransform ctm = svg.ctm;
    return @{
             @"a":@(ctm.a),
             @"b":@(ctm.b),
             @"c":@(ctm.c),
             @"d":@(ctm.d),
             @"e":@(ctm.tx),
             @"f":@(ctm.ty)
             };
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getScreenCTM:(nonnull NSNumber *)reactTag)
{
    __block DevLauncherRNSVGPlatformView *view;
    dispatch_sync(dispatch_get_main_queue(), ^{
        view = [self.bridge.uiManager viewForReactTag:reactTag];
    });
    if (![view isKindOfClass:[DevLauncherRNSVGRenderable class]]) {
        RCTLogError(@"Invalid svg returned from registry, expecting DevLauncherRNSVGRenderable, got: %@", view);
        return nil;
    }

    DevLauncherRNSVGRenderable *svg = (DevLauncherRNSVGRenderable *)view;
    CGAffineTransform ctm = svg.ctm;
    return @{
             @"a":@(ctm.a),
             @"b":@(ctm.b),
             @"c":@(ctm.c),
             @"d":@(ctm.d),
             @"e":@(ctm.tx),
             @"f":@(ctm.ty)
             };
}

@end


