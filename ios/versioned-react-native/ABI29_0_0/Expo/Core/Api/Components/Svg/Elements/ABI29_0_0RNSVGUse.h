/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RNSVGRenderable.h"

/**
 * ABI29_0_0RNSVG defination are implemented as abstract UIViews for all elements inside Defs.
 */

@interface ABI29_0_0RNSVGUse : ABI29_0_0RNSVGRenderable

@property (nonatomic, strong) NSString *href;
@property (nonatomic, strong) NSString *width;
@property (nonatomic, strong) NSString *height;
@end
