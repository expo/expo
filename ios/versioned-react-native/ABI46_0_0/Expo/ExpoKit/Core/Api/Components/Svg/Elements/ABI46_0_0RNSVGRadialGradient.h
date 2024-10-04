/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RNSVGNode.h"
#import "ABI46_0_0RNSVGLength.h"

@interface ABI46_0_0RNSVGRadialGradient : ABI46_0_0RNSVGNode

@property (nonatomic, strong) ABI46_0_0RNSVGLength *fx;
@property (nonatomic, strong) ABI46_0_0RNSVGLength *fy;
@property (nonatomic, strong) ABI46_0_0RNSVGLength *rx;
@property (nonatomic, strong) ABI46_0_0RNSVGLength *ry;
@property (nonatomic, strong) ABI46_0_0RNSVGLength *cx;
@property (nonatomic, strong) ABI46_0_0RNSVGLength *cy;
@property (nonatomic, copy) NSArray<NSNumber *> *gradient;
@property (nonatomic, assign) ABI46_0_0RNSVGUnits gradientUnits;
@property (nonatomic, assign) CGAffineTransform gradientTransform;

@end
