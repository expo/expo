/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGLength.h"
#import "ABI47_0_0RNSVGNode.h"

@interface ABI47_0_0RNSVGLinearGradient : ABI47_0_0RNSVGNode

@property (nonatomic, strong) ABI47_0_0RNSVGLength *x1;
@property (nonatomic, strong) ABI47_0_0RNSVGLength *y1;
@property (nonatomic, strong) ABI47_0_0RNSVGLength *x2;
@property (nonatomic, strong) ABI47_0_0RNSVGLength *y2;
@property (nonatomic, copy) NSArray<NSNumber *> *gradient;
@property (nonatomic, assign) ABI47_0_0RNSVGUnits gradientUnits;
@property (nonatomic, assign) CGAffineTransform gradientTransform;

@end
