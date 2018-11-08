/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGRenderable.h"
#import "ABI31_0_0RNSVGLength.h"

/**
 * ABI31_0_0RNSVG defination are implemented as abstract UIViews for all elements inside Defs.
 */

@interface ABI31_0_0RNSVGUse : ABI31_0_0RNSVGRenderable

@property (nonatomic, strong) NSString *href;
@property (nonatomic, strong) ABI31_0_0RNSVGLength *usewidth;
@property (nonatomic, strong) ABI31_0_0RNSVGLength *useheight;
@end
