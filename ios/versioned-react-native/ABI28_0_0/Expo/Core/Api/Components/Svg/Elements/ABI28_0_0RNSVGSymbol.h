/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGGroup.h"

/**
 * ABI28_0_0RNSVG defination are implemented as abstract UIViews for all elements inside Defs.
 */

@interface ABI28_0_0RNSVGSymbol : ABI28_0_0RNSVGGroup

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI28_0_0RNSVGVBMOS meetOrSlice;

- (void)renderSymbolTo:(CGContextRef)context width:(CGFloat)width height:(CGFloat)height;

@end
