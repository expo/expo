/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGBrushConverter.h"
#import "RNSVGPercentageConverter.h"

@implementation RNSVGBrushConverter

- (void)drawLinearGradient:(CGContextRef)context
{
    
    CGGradientRef gradient = CGGradientRetain([RCTConvert CGGradient:self.colors offset:0]);
    CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;
    
    CGRect box = CGContextGetClipBoundingBox(context);
    float height = CGRectGetHeight(box);
    float width = CGRectGetWidth(box);
    float midX = CGRectGetMidX(box);
    float midY = CGRectGetMidY(box);
    float offsetX = (midX - width / 2);
    float offsetY = (midY - height / 2);
    
    RNSVGPercentageConverter* convert = [[RNSVGPercentageConverter alloc] init];
    CGFloat x1 = [convert stringToFloat:(NSString *)[self.points objectAtIndex:0] relative:width offset:offsetX];
    CGFloat y1 = [convert stringToFloat:(NSString *)[self.points objectAtIndex:1] relative:height offset:offsetY];
    CGFloat x2 = [convert stringToFloat:(NSString *)[self.points objectAtIndex:2] relative:width offset:offsetX];
    CGFloat y2 = [convert stringToFloat:(NSString *)[self.points objectAtIndex:3] relative:height offset:offsetY];
    
    CGContextDrawLinearGradient(context, gradient, CGPointMake(x1, y1), CGPointMake(x2, y2), extendOptions);
    CGGradientRelease(gradient);
}

- (void)drawRidialGradient:(CGContextRef)context
{
    CGGradientRef gradient = CGGradientRetain([RCTConvert CGGradient:self.colors offset:0]);
    CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;
    
    CGRect box = CGContextGetClipBoundingBox(context);
    float height = CGRectGetHeight(box);
    float width = CGRectGetWidth(box);
    float midX = CGRectGetMidX(box);
    float midY = CGRectGetMidY(box);
    float offsetX = (midX - width / 2);
    float offsetY = (midY - height / 2);
    
    RNSVGPercentageConverter* convert = [[RNSVGPercentageConverter alloc] init];
    CGFloat rx = [convert stringToFloat:(NSString *)[_points objectAtIndex:2] relative:width offset:0];
    CGFloat ry = [convert stringToFloat:(NSString *)[_points objectAtIndex:3] relative:height offset:0];
    CGFloat fx = [convert stringToFloat:(NSString *)[_points objectAtIndex:0] relative:width offset:offsetX];
    CGFloat fy = [convert stringToFloat:(NSString *)[_points objectAtIndex:1] relative:height offset:offsetY] / (ry / rx);
    CGFloat cx = [convert stringToFloat:(NSString *)[_points objectAtIndex:4] relative:width offset:offsetX];
    CGFloat cy = [convert stringToFloat:(NSString *)[_points objectAtIndex:5] relative:height offset:offsetY] / (ry / rx);
    
    CGAffineTransform transform = CGAffineTransformMakeScale(1, ry / rx);
    CGContextConcatCTM(context, transform);
    
    CGContextDrawRadialGradient(context, gradient, CGPointMake(fx, fy), 0, CGPointMake(cx, cy), rx, extendOptions);
    CGGradientRelease(gradient);
}

@end

