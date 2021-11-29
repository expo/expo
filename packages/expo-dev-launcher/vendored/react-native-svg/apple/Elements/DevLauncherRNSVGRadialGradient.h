/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGNode.h"
#import "DevLauncherRNSVGLength.h"

@interface DevLauncherRNSVGRadialGradient : DevLauncherRNSVGNode

@property (nonatomic, strong) DevLauncherRNSVGLength *fx;
@property (nonatomic, strong) DevLauncherRNSVGLength *fy;
@property (nonatomic, strong) DevLauncherRNSVGLength *rx;
@property (nonatomic, strong) DevLauncherRNSVGLength *ry;
@property (nonatomic, strong) DevLauncherRNSVGLength *cx;
@property (nonatomic, strong) DevLauncherRNSVGLength *cy;
@property (nonatomic, copy) NSArray<NSNumber *> *gradient;
@property (nonatomic, assign) DevLauncherRNSVGUnits gradientUnits;
@property (nonatomic, assign) CGAffineTransform gradientTransform;

@end
