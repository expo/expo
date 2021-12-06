/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTShadowView.h>

@class ABI44_0_0RCTRootShadowView;

@interface ABI44_0_0RCTShadowView (Internal)

@property (nonatomic, weak, readwrite) ABI44_0_0RCTRootShadowView *rootView;

@end
