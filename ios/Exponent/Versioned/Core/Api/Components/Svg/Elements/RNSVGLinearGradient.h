/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGNode.h"

@interface RNSVGLinearGradient : RNSVGNode

@property (nonatomic, strong) NSString *x1;
@property (nonatomic, strong) NSString *y1;
@property (nonatomic, strong) NSString *x2;
@property (nonatomic, strong) NSString *y2;
@property (nonatomic, copy) NSArray<NSNumber *> *gradient;
@property (nonatomic, assign)RNSVGUnits gradientUnits;
@property (nonatomic, assign)CGAffineTransform gradientTransform;

@end
