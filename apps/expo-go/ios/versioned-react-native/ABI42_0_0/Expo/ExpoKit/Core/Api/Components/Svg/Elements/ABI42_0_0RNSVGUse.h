/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGRenderable.h"
#import "ABI42_0_0RNSVGLength.h"

/**
 * ABI42_0_0RNSVG defination are implemented as abstract UIViews for all elements inside Defs.
 */

@interface ABI42_0_0RNSVGUse : ABI42_0_0RNSVGRenderable

@property (nonatomic, strong) NSString *href;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *x;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *y;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *usewidth;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *useheight;
@end
