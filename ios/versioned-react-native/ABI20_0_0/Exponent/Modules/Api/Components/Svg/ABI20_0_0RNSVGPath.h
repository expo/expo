/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI20_0_0RNSVGPathParser.h"
#import "ABI20_0_0RNSVGRenderable.h"

@interface ABI20_0_0RNSVGPath : ABI20_0_0RNSVGRenderable

@property (nonatomic, strong) ABI20_0_0RNSVGPathParser *d;

- (NSArray *)getBezierCurves;

@end
