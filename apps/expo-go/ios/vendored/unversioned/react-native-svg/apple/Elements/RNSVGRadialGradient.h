/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGLength.h"
#import "RNSVGNode.h"

@interface RNSVGRadialGradient : RNSVGNode

@property (nonatomic, strong) RNSVGLength *fx;
@property (nonatomic, strong) RNSVGLength *fy;
@property (nonatomic, strong) RNSVGLength *rx;
@property (nonatomic, strong) RNSVGLength *ry;
@property (nonatomic, strong) RNSVGLength *cx;
@property (nonatomic, strong) RNSVGLength *cy;
@property (nonatomic, copy) NSArray<NSNumber *> *gradient;
@property (nonatomic, assign) RNSVGUnits gradientUnits;
@property (nonatomic, assign) CGAffineTransform gradientTransform;

@end
