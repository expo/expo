/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTSurfaceStage.h>

@interface ABI34_0_0RCTSurfaceHostingComponentState: NSObject

@property (nonatomic, readonly, assign) CGSize intrinsicSize;
@property (nonatomic, readonly, assign) ABI34_0_0RCTSurfaceStage stage;

+ (instancetype)newWithStage:(ABI34_0_0RCTSurfaceStage)stage
               intrinsicSize:(CGSize)intrinsicSize;

@end
