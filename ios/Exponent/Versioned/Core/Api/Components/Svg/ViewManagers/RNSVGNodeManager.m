/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGNodeManager.h"

#import "RNSVGNode.h"

static const NSUInteger kMatrixArrayLength = 4 * 4;

@implementation RNSVGNodeManager

+ (CGFloat)convertToRadians:(id)json
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        if ([stringValue hasSuffix:@"deg"]) {
            CGFloat degrees = [[stringValue substringToIndex:stringValue.length - 3] floatValue];
            return degrees * (CGFloat)M_PI / 180;
        }
        if ([stringValue hasSuffix:@"rad"]) {
            return [[stringValue substringToIndex:stringValue.length - 3] floatValue];
        }
    }
    return [json floatValue];
}

+ (CATransform3D)CATransform3DFromMatrix:(id)json
{
    CATransform3D transform = CATransform3DIdentity;
    if (!json) {
        return transform;
    }
    if (![json isKindOfClass:[NSArray class]]) {
        RCTLogConvertError(json, @"a CATransform3D. Expected array for transform matrix.");
        return transform;
    }
    NSArray *array = json;
    if ([array count] != kMatrixArrayLength) {
        RCTLogConvertError(json, @"a CATransform3D. Expected 4x4 matrix array.");
        return transform;
    }
    for (NSUInteger i = 0; i < kMatrixArrayLength; i++) {
        ((CGFloat *)&transform)[i] = [RCTConvert CGFloat:array[i]];
    }
    return transform;
}

+ (CATransform3D)CATransform3D:(id)json
{
    CATransform3D transform = CATransform3DIdentity;
    if (!json) {
        return transform;
    }
    if (![json isKindOfClass:[NSArray class]]) {
        RCTLogConvertError(json, @"a CATransform3D. Did you pass something other than an array?");
        return transform;
    }
    // legacy matrix support
    if ([(NSArray *)json count] == kMatrixArrayLength && [json[0] isKindOfClass:[NSNumber class]]) {
        RCTLogWarn(@"[RCTConvert CATransform3D:] has deprecated a matrix as input. Pass an array of configs (which can contain a matrix key) instead.");
        return [self CATransform3DFromMatrix:json];
    }

    CGFloat zeroScaleThreshold = FLT_EPSILON;

    for (NSDictionary *transformConfig in (NSArray<NSDictionary *> *)json) {
        if (transformConfig.count != 1) {
            RCTLogConvertError(json, @"a CATransform3D. You must specify exactly one property per transform object.");
            return transform;
        }
        NSString *property = transformConfig.allKeys[0];
        id value = transformConfig[property];

        if ([property isEqualToString:@"matrix"]) {
            transform = [self CATransform3DFromMatrix:value];

        } else if ([property isEqualToString:@"perspective"]) {
            transform.m34 = -1 / [value floatValue];

        } else if ([property isEqualToString:@"rotateX"]) {
            CGFloat rotate = [self convertToRadians:value];
            transform = CATransform3DRotate(transform, rotate, 1, 0, 0);

        } else if ([property isEqualToString:@"rotateY"]) {
            CGFloat rotate = [self convertToRadians:value];
            transform = CATransform3DRotate(transform, rotate, 0, 1, 0);

        } else if ([property isEqualToString:@"rotate"] || [property isEqualToString:@"rotateZ"]) {
            CGFloat rotate = [self convertToRadians:value];
            transform = CATransform3DRotate(transform, rotate, 0, 0, 1);

        } else if ([property isEqualToString:@"scale"]) {
            CGFloat scale = [value floatValue];
            scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
            transform = CATransform3DScale(transform, scale, scale, 1);

        } else if ([property isEqualToString:@"scaleX"]) {
            CGFloat scale = [value floatValue];
            scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
            transform = CATransform3DScale(transform, scale, 1, 1);

        } else if ([property isEqualToString:@"scaleY"]) {
            CGFloat scale = [value floatValue];
            scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
            transform = CATransform3DScale(transform, 1, scale, 1);

        } else if ([property isEqualToString:@"translate"]) {
            NSArray *array = (NSArray<NSNumber *> *)value;
            CGFloat translateX = [array[0] floatValue];
            CGFloat translateY = [array[1] floatValue];
            CGFloat translateZ = array.count > 2 ? [array[2] floatValue] : 0;
            transform = CATransform3DTranslate(transform, translateX, translateY, translateZ);

        } else if ([property isEqualToString:@"translateX"]) {
            CGFloat translate = [value floatValue];
            transform = CATransform3DTranslate(transform, translate, 0, 0);

        } else if ([property isEqualToString:@"translateY"]) {
            CGFloat translate = [value floatValue];
            transform = CATransform3DTranslate(transform, 0, translate, 0);

        } else if ([property isEqualToString:@"skewX"]) {
            CGFloat skew = [self convertToRadians:value];
            transform.m21 = tanf((float)skew);

        } else if ([property isEqualToString:@"skewY"]) {
            CGFloat skew = [self convertToRadians:value];
            transform.m12 = tanf((float)skew);

        } else {
            RCTLogError(@"Unsupported transform type for a CATransform3D: %@.", property);
        }
    }
    return transform;
}

RCT_EXPORT_MODULE()

- (RNSVGNode *)node
{
    return [RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

RCT_EXPORT_VIEW_PROPERTY(name, NSString)
RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, RNSVGNode)
{
    CATransform3D transform3d = json ? [RNSVGNodeManager CATransform3D:json] : defaultView.layer.transform;
    CGAffineTransform transform = CATransform3DGetAffineTransform(transform3d);
    view.invTransform = CGAffineTransformInvert(transform);
    view.transforms = transform;
    [view invalidate];
}
RCT_EXPORT_VIEW_PROPERTY(mask, NSString)
RCT_EXPORT_VIEW_PROPERTY(markerStart, NSString)
RCT_EXPORT_VIEW_PROPERTY(markerMid, NSString)
RCT_EXPORT_VIEW_PROPERTY(markerEnd, NSString)
RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
RCT_EXPORT_VIEW_PROPERTY(clipRule, RNSVGCGFCRule)
RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onLayout, RCTDirectEventBlock)

RCT_CUSTOM_SHADOW_PROPERTY(top, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(right, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(start, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(end, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(bottom, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(left, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(width, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(height, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(minWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(maxWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(minHeight, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(maxHeight, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(borderTopWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderRightWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderBottomWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderLeftWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderStartWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderEndWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderWidth, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(marginTop, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginRight, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginBottom, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginLeft, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginStart, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginEnd, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginVertical, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginHorizontal, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(margin, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(paddingTop, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingRight, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingBottom, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingLeft, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingStart, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingEnd, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingVertical, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingHorizontal, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(padding, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(flex, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexGrow, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexShrink, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexBasis, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexDirection, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexWrap, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(justifyContent, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(alignItems, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(alignSelf, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(alignContent, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(position, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(aspectRatio, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(overflow, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(display, id, RNSVGNode) {}
RCT_CUSTOM_VIEW_PROPERTY(display, id, RNSVGNode)
{
    view.display = json;
}

RCT_CUSTOM_SHADOW_PROPERTY(direction, id, RNSVGNode) {}

@end
