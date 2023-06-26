/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTShadowView.h>

@class ABI49_0_0RCTRootShadowView;

@interface ABI49_0_0RCTShadowView (Internal)

@property (nonatomic, weak, readwrite) ABI49_0_0RCTRootShadowView *rootView;

@end
