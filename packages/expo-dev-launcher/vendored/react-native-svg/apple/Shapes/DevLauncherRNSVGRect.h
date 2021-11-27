/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "DevLauncherRNSVGPath.h"

@interface DevLauncherRNSVGRect : DevLauncherRNSVGRenderable

@property (nonatomic, strong) DevLauncherRNSVGLength* x;
@property (nonatomic, strong) DevLauncherRNSVGLength* y;
@property (nonatomic, strong) DevLauncherRNSVGLength* rectwidth;
@property (nonatomic, strong) DevLauncherRNSVGLength* rectheight;
@property (nonatomic, strong) DevLauncherRNSVGLength* rx;
@property (nonatomic, strong) DevLauncherRNSVGLength* ry;

@end
