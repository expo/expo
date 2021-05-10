/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTShadowView.h>

@class ABI41_0_0RCTRootShadowView;

@interface ABI41_0_0RCTShadowView (Internal)

@property (nonatomic, weak, readwrite) ABI41_0_0RCTRootShadowView *rootView;

@end
