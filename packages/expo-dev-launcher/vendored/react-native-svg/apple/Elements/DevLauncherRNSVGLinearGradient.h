/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGNode.h"
#import "DevLauncherRNSVGLength.h"

@interface DevLauncherRNSVGLinearGradient : DevLauncherRNSVGNode

@property (nonatomic, strong) DevLauncherRNSVGLength *x1;
@property (nonatomic, strong) DevLauncherRNSVGLength *y1;
@property (nonatomic, strong) DevLauncherRNSVGLength *x2;
@property (nonatomic, strong) DevLauncherRNSVGLength *y2;
@property (nonatomic, copy) NSArray<NSNumber *> *gradient;
@property (nonatomic, assign) DevLauncherRNSVGUnits gradientUnits;
@property (nonatomic, assign) CGAffineTransform gradientTransform;

@end
