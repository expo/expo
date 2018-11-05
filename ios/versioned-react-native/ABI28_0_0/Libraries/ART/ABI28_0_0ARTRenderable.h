/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI28_0_0ARTBrush.h"
#import "ABI28_0_0ARTCGFloatArray.h"
#import "ABI28_0_0ARTNode.h"

@interface ABI28_0_0ARTRenderable : ABI28_0_0ARTNode

@property (nonatomic, strong) ABI28_0_0ARTBrush *fill;
@property (nonatomic, assign) CGColorRef stroke;
@property (nonatomic, assign) CGFloat strokeWidth;
@property (nonatomic, assign) CGLineCap strokeCap;
@property (nonatomic, assign) CGLineJoin strokeJoin;
@property (nonatomic, assign) ABI28_0_0ARTCGFloatArray strokeDash;

@end
