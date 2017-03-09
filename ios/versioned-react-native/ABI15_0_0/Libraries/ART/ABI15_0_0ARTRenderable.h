/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI15_0_0ARTBrush.h"
#import "ABI15_0_0ARTCGFloatArray.h"
#import "ABI15_0_0ARTNode.h"

@interface ABI15_0_0ARTRenderable : ABI15_0_0ARTNode

@property (nonatomic, strong) ABI15_0_0ARTBrush *fill;
@property (nonatomic, assign) CGColorRef stroke;
@property (nonatomic, assign) CGFloat strokeWidth;
@property (nonatomic, assign) CGLineCap strokeCap;
@property (nonatomic, assign) CGLineJoin strokeJoin;
@property (nonatomic, assign) ABI15_0_0ARTCGFloatArray strokeDash;

@end
