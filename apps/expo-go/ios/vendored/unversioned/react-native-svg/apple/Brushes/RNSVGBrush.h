/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import "RNSVGPainter.h"

@interface RNSVGBrush : NSObject

@property (nonatomic, strong) NSString *brushRef;

/* @abstract */
- (instancetype)initWithArray:(NSArray *)data;

/**
 * @abstract
 * For certain brushes we can fast path a combined fill and stroke.
 * For those brushes we override applyFillColor which sets the fill
 * color to be used by those batch paints. Those return YES.
 * We can't batch gradient painting in CoreGraphics, so those will
 * return NO and paint gets called instead.
 */
- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity;

- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity;

- (CGColorRef)getColorWithOpacity:(CGFloat)opacity;

/**
 * @abstract
 * paint fills the context with a brush. The context is assumed to
 * be clipped.
 */
- (void)paint:(CGContextRef)context opacity:(CGFloat)opacity painter:(RNSVGPainter *)painter bounds:(CGRect)bounds;

@end
