/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <math.h>
#import "RNSVGViewBox.h"
#import "RNSVGUse.h"

@implementation RNSVGViewBox

+ (CGAffineTransform)getTransform:(CGRect)vbRect eRect:(CGRect)eRect align:(NSString *)align meetOrSlice:(RNSVGVBMOS)meetOrSlice
{
    // based on https://svgwg.org/svg2-draft/coords.html#ComputingAViewportsTransform

    // Let vb-x, vb-y, vb-width, vb-height be the min-x, min-y, width and height values of the viewBox attribute respectively.
    CGFloat vbX = CGRectGetMinX(vbRect);
    CGFloat vbY = CGRectGetMinY(vbRect);
    CGFloat vbWidth = CGRectGetWidth(vbRect);
    CGFloat vbHeight = CGRectGetHeight(vbRect);

    // Let e-x, e-y, e-width, e-height be the position and size of the element respectively.
    CGFloat eX = CGRectGetMinX(eRect);
    CGFloat eY = CGRectGetMinY(eRect);
    CGFloat eWidth = CGRectGetWidth(eRect);
    CGFloat eHeight = CGRectGetHeight(eRect);

    // Let align be the align value of preserveAspectRatio, or 'xMidyMid' if preserveAspectRatio is not defined.

    // Let meetOrSlice be the meetOrSlice value of preserveAspectRatio, or 'meet' if preserveAspectRatio is not defined or if meetOrSlice is missing from this value.

    // Initialize scale-x to e-width/vb-width.
    CGFloat scaleX = eWidth / vbWidth;

    // Initialize scale-y to e-height/vb-height.
    CGFloat scaleY = eHeight / vbHeight;

    // Initialize translate-x to e-x - (vb-x * scale-x).
    // Initialize translate-y to e-y - (vb-y * scale-y).
    CGFloat translateX = eX - (vbX * scaleX);
    CGFloat translateY = eY - (vbY * scaleY);

    // If align is 'none'
    if (meetOrSlice == kRNSVGVBMOSNone) {
        // Let scale be set the smaller value of scale-x and scale-y.
        // Assign scale-x and scale-y to scale.
        CGFloat scale = scaleX = scaleY = fmin(scaleX, scaleY);

        // If scale is greater than 1
        if (scale > 1) {
            // Minus translateX by (eWidth / scale - vbWidth) / 2
            // Minus translateY by (eHeight / scale - vbHeight) / 2
            translateX -= (eWidth / scale - vbWidth) / 2;
            translateY -= (eHeight / scale - vbHeight) / 2;
        } else {
            translateX -= (eWidth - vbWidth * scale) / 2;
            translateY -= (eHeight - vbHeight * scale) / 2;
        }
    } else {
        // If align is not 'none' and meetOrSlice is 'meet', set the larger of scale-x and scale-y to the smaller.
        // Otherwise, if align is not 'none' and meetOrSlice is 'slice', set the smaller of scale-x and scale-y to the larger.
        if (![align isEqualToString: @"none"] && meetOrSlice == kRNSVGVBMOSMeet) {
            scaleX = scaleY = fmin(scaleX, scaleY);
        } else if (![align isEqualToString: @"none"] && meetOrSlice == kRNSVGVBMOSSlice) {
            scaleX = scaleY = fmax(scaleX, scaleY);
        }

        // If align contains 'xMid', add (e-width - vb-width * scale-x) / 2 to translate-x.
        if ([align containsString:@"xMid"]) {
            translateX += (eWidth - vbWidth * scaleX) / 2.0;
        }

        // If align contains 'xMax', add (e-width - vb-width * scale-x) to translate-x.
        if ([align containsString:@"xMax"]) {
            translateX += (eWidth - vbWidth * scaleX);
        }

        // If align contains 'yMid', add (e-height - vb-height * scale-y) / 2 to translate-y.
        if ([align containsString:@"YMid"]) {
            translateY += (eHeight - vbHeight * scaleY) / 2.0;
        }

        // If align contains 'yMax', add (e-height - vb-height * scale-y) to translate-y.
        if ([align containsString:@"YMax"]) {
            translateY += (eHeight - vbHeight * scaleY);
        }
    }

    // The transform applied to content contained by the element is given by
    // translate(translate-x, translate-y) scale(scale-x, scale-y).
    CGAffineTransform transform = CGAffineTransformMakeTranslation(translateX, translateY);
    return CGAffineTransformScale(transform, scaleX, scaleY);
}

@end
