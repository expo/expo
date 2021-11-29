/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGRenderable.h"
#import "DevLauncherRNSVGLength.h"

/**
 * DevLauncherRNSVG defination are implemented as abstract UIViews for all elements inside Defs.
 */

@interface DevLauncherRNSVGUse : DevLauncherRNSVGRenderable

@property (nonatomic, strong) NSString *href;
@property (nonatomic, strong) DevLauncherRNSVGLength *x;
@property (nonatomic, strong) DevLauncherRNSVGLength *y;
@property (nonatomic, strong) DevLauncherRNSVGLength *usewidth;
@property (nonatomic, strong) DevLauncherRNSVGLength *useheight;
@end
