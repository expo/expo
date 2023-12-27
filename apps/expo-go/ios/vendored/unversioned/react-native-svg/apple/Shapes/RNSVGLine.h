/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RNSVGPath.h"

@interface RNSVGLine : RNSVGRenderable
@property (nonatomic, strong) RNSVGLength *x1;
@property (nonatomic, strong) RNSVGLength *y1;
@property (nonatomic, strong) RNSVGLength *x2;
@property (nonatomic, strong) RNSVGLength *y2;
@end
