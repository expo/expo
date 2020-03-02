/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI37_0_0ARTBrush.h"
#import "ABI37_0_0ARTCGFloatArray.h"
#import "ABI37_0_0ARTNode.h"

@interface ABI37_0_0ARTRenderable : ABI37_0_0ARTNode

@property (nonatomic, strong) ABI37_0_0ARTBrush *fill;
@property (nonatomic, assign) CGColorRef stroke;
@property (nonatomic, assign) CGFloat strokeWidth;
@property (nonatomic, assign) CGLineCap strokeCap;
@property (nonatomic, assign) CGLineJoin strokeJoin;
@property (nonatomic, assign) ABI37_0_0ARTCGFloatArray strokeDash;

@end
