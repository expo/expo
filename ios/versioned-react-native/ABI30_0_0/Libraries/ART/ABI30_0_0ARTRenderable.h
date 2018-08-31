/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI30_0_0ARTBrush.h"
#import "ABI30_0_0ARTCGFloatArray.h"
#import "ABI30_0_0ARTNode.h"

@interface ABI30_0_0ARTRenderable : ABI30_0_0ARTNode

@property (nonatomic, strong) ABI30_0_0ARTBrush *fill;
@property (nonatomic, assign) CGColorRef stroke;
@property (nonatomic, assign) CGFloat strokeWidth;
@property (nonatomic, assign) CGLineCap strokeCap;
@property (nonatomic, assign) CGLineJoin strokeJoin;
@property (nonatomic, assign) ABI30_0_0ARTCGFloatArray strokeDash;

@end
