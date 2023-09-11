/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGLength.h"
#import "RNSVGRenderable.h"

/**
 * RNSVG defination are implemented as abstract UIViews for all elements inside Defs.
 */

@interface RNSVGUse : RNSVGRenderable

@property (nonatomic, strong) NSString *href;
@property (nonatomic, strong) RNSVGLength *x;
@property (nonatomic, strong) RNSVGLength *y;
@property (nonatomic, strong) RNSVGLength *usewidth;
@property (nonatomic, strong) RNSVGLength *useheight;
@end
