/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGNodeManager.h"

#import "ABI41_0_0RNSVGNode.h"

static const NSUInteger kMatrixArrayLength = 4 * 4;

@implementation ABI41_0_0RNSVGNodeManager

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
        ABI41_0_0RCTLogConvertError(json, @"a CATransform3D. Expected array for transform matrix.");
        return transform;
    }
    NSArray *array = json;
    if ([array count] != kMatrixArrayLength) {
        ABI41_0_0RCTLogConvertError(json, @"a CATransform3D. Expected 4x4 matrix array.");
        return transform;
    }
    for (NSUInteger i = 0; i < kMatrixArrayLength; i++) {
        ((CGFloat *)&transform)[i] = [ABI41_0_0RCTConvert CGFloat:array[i]];
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
        ABI41_0_0RCTLogConvertError(json, @"a CATransform3D. Did you pass something other than an array?");
        return transform;
    }
    // legacy matrix support
    if ([(NSArray *)json count] == kMatrixArrayLength && [json[0] isKindOfClass:[NSNumber class]]) {
        ABI41_0_0RCTLogWarn(@"[ABI41_0_0RCTConvert CATransform3D:] has deprecated a matrix as input. Pass an array of configs (which can contain a matrix key) instead.");
        return [self CATransform3DFromMatrix:json];
    }

    CGFloat zeroScaleThreshold = FLT_EPSILON;

    for (NSDictionary *transformConfig in (NSArray<NSDictionary *> *)json) {
        if (transformConfig.count != 1) {
            ABI41_0_0RCTLogConvertError(json, @"a CATransform3D. You must specify exactly one property per transform object.");
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
            ABI41_0_0RCTLogError(@"Unsupported transform type for a CATransform3D: %@.", property);
        }
    }
    return transform;
}

ABI41_0_0RCT_EXPORT_MODULE()

- (ABI41_0_0RNSVGNode *)node
{
    return [ABI41_0_0RNSVGNode new];
}

- (UIView *)view
{
    return [self node];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(name, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI41_0_0RNSVGNode)
{
    CATransform3D transform3d = json ? [ABI41_0_0RNSVGNodeManager CATransform3D:json] : defaultView.layer.transform;
    CGAffineTransform transform = CATransform3DGetAffineTransform(transform3d);
    view.invTransform = CGAffineTransformInvert(transform);
    view.transforms = transform;
    [view invalidate];
}
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(mask, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(markerStart, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(markerMid, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(markerEnd, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(clipRule, ABI41_0_0RNSVGCGFCRule)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onLayout, ABI41_0_0RCTDirectEventBlock)

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(top, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(right, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(start, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(end, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(bottom, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(left, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(width, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(height, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(minWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(maxWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(minHeight, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(maxHeight, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(borderTopWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(borderRightWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(borderBottomWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(borderLeftWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(borderStartWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(borderEndWidth, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(borderWidth, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginTop, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginRight, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginBottom, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginLeft, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginStart, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginEnd, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginVertical, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(marginHorizontal, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(margin, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingTop, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingRight, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingBottom, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingLeft, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingStart, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingEnd, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingVertical, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(paddingHorizontal, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(padding, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(flex, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(flexGrow, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(flexShrink, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(flexBasis, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(flexDirection, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(flexWrap, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(justifyContent, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(alignItems, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(alignSelf, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(alignContent, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(position, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(aspectRatio, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(display, id, ABI41_0_0RNSVGNode) {}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(display, id, ABI41_0_0RNSVGNode)
{
    view.display = json;
}

ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(direction, id, ABI41_0_0RNSVGNode) {}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI41_0_0RCTPointerEvents, ABI41_0_0RNSVGNode)
{
    view.pointerEvents = json ? [ABI41_0_0RCTConvert ABI41_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
}

@end
