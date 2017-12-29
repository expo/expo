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

+ (CGAffineTransform)getTransform:(CGRect)vbRect eRect:(CGRect)eRect align:(NSString *)align meetOrSlice:(RNSVGVBMOS)meetOrSlice fromSymbol:(BOOL)fromSymbol
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
    
    
    // Initialize translate-x to vb-x - e-x.
    // Initialize translate-y to vb-y - e-y.
    CGFloat translateX = vbX - eX;
    CGFloat translateY = vbY - eY;
    
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
        
        // If align contains 'xMid', minus (e-width / scale-x - vb-width) / 2 from transform-x.
        if ([align containsString:@"xMid"]) {
            translateX -= (eWidth / scaleX - vbWidth) / 2;
        }
        
        // If align contains 'xMax', minus (e-width / scale-x - vb-width) from transform-x.
        if ([align containsString:@"xMax"]) {
            translateX -= eWidth / scaleX - vbWidth;
        }
        
        // If align contains 'yMid', minus (e-height / scale-y - vb-height) / 2 from transform-y.
        if ([align containsString:@"YMid"]) {
            translateY -= (eHeight / scaleY - vbHeight) / 2;
        }
        
        // If align contains 'yMax', minus (e-height / scale-y - vb-height) from transform-y.
        if ([align containsString:@"YMax"]) {
            translateY -= eHeight / scaleY - vbHeight;
        }
    }
    
    CGAffineTransform transform = CGAffineTransformMakeScale(scaleX, scaleY);
    return CGAffineTransformTranslate(transform, -translateX * (fromSymbol ? scaleX : 1), -translateY * (fromSymbol ? scaleY : 1));
}

@end
