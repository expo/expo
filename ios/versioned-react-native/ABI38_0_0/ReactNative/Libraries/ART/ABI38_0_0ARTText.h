/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI38_0_0ARTRenderable.h"
#import "ABI38_0_0ARTTextFrame.h"

@interface ABI38_0_0ARTText : ABI38_0_0ARTRenderable

@property (nonatomic, assign) CTTextAlignment alignment;
@property (nonatomic, assign) ABI38_0_0ARTTextFrame textFrame;

@end
