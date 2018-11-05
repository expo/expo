/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTShadowView.h>

@class ABI26_0_0RCTRootShadowView;

@interface ABI26_0_0RCTShadowView (Internal)

@property (nonatomic, weak, readwrite) ABI26_0_0RCTRootShadowView *rootView;

@end
