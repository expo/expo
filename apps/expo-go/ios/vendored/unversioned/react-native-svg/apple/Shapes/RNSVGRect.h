/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RNSVGPath.h"

@interface RNSVGRect : RNSVGRenderable

@property (nonatomic, strong) RNSVGLength *x;
@property (nonatomic, strong) RNSVGLength *y;
@property (nonatomic, strong) RNSVGLength *rectwidth;
@property (nonatomic, strong) RNSVGLength *rectheight;
@property (nonatomic, strong) RNSVGLength *rx;
@property (nonatomic, strong) RNSVGLength *ry;

@end
