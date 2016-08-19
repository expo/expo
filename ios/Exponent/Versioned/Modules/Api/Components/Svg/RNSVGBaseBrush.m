/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGBaseBrush.h"
#import "RCTConvert+RNSVG.h"
#import "RCTLog.h"

@implementation RNSVGBaseBrush

- (instancetype)initWithArray:(NSArray *)array
{
    if ((self = [super initWithArray:array])) {
        if (array.count != 2) {
            RCTLogError(@"-[%@ %@] expects 2 elements, received %@",
                        self.class, NSStringFromSelector(_cmd), array);
            return nil;
        }
        
        self.brushRef = [array objectAtIndex:1];
    }
    return self;
}

- (void)paint:(CGContextRef)context opacity:(CGFloat)opacity brushConverter:(RNSVGBrushConverter *)brushConverter
{
    BOOL transparency = opacity < 1;
    if (transparency) {
        CGContextSetAlpha(context, opacity);
        CGContextBeginTransparencyLayer(context, NULL);
    }
    
    if (brushConverter.type == kRNSVGLinearGradient) {
        [brushConverter drawLinearGradient:context];
    } else if (brushConverter.type == kRNSVGRadialGradient) {
        [brushConverter drawRidialGradient:context];
    } else if (brushConverter.type == kRNSVGPattern) {
        // todo:
    }
    
    if (transparency) {
        CGContextEndTransparencyLayer(context);
    }
}

@end
