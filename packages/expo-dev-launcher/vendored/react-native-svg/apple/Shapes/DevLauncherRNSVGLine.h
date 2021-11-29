/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "DevLauncherRNSVGPath.h"

@interface DevLauncherRNSVGLine : DevLauncherRNSVGRenderable
@property (nonatomic, strong) DevLauncherRNSVGLength* x1;
@property (nonatomic, strong) DevLauncherRNSVGLength* y1;
@property (nonatomic, strong) DevLauncherRNSVGLength* x2;
@property (nonatomic, strong) DevLauncherRNSVGLength* y2;
@end
