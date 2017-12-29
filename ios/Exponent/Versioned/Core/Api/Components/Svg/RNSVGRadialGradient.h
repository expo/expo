/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGNode.h"

@interface RNSVGRadialGradient : RNSVGNode

@property (nonatomic, strong) NSString *fx;
@property (nonatomic, strong) NSString *fy;
@property (nonatomic, strong) NSString *rx;
@property (nonatomic, strong) NSString *ry;
@property (nonatomic, strong) NSString *cx;
@property (nonatomic, strong) NSString *cy;
@property (nonatomic, copy) NSArray<NSNumber *> *gradient;
@property (nonatomic, assign)RNSVGUnits gradientUnits;
@property (nonatomic, assign)CGAffineTransform gradientTransform;

@end
