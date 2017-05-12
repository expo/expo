/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI17_0_0RNSVGPathParser.h"
#import "ABI17_0_0RNSVGRenderable.h"

@interface ABI17_0_0RNSVGPath : ABI17_0_0RNSVGRenderable

@property (nonatomic, strong) ABI17_0_0RNSVGPathParser *d;

- (NSArray *)getBezierCurves;

@end
