/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI21_0_0RNSVGPathParser.h"
#import "ABI21_0_0RNSVGRenderable.h"

@interface ABI21_0_0RNSVGPath : ABI21_0_0RNSVGRenderable

@property (nonatomic, strong) ABI21_0_0RNSVGPathParser *d;

- (NSArray *)getBezierCurves;

@end
