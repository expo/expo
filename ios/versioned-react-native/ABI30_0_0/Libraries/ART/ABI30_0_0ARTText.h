/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI30_0_0ARTRenderable.h"
#import "ABI30_0_0ARTTextFrame.h"

@interface ABI30_0_0ARTText : ABI30_0_0ARTRenderable

@property (nonatomic, assign) CTTextAlignment alignment;
@property (nonatomic, assign) ABI30_0_0ARTTextFrame textFrame;

@end
