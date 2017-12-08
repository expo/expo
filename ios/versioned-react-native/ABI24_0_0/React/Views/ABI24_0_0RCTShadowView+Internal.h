/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI24_0_0/ABI24_0_0RCTShadowView.h>

@class ABI24_0_0RCTRootShadowView;

@interface ABI24_0_0RCTShadowView (Internal)

@property (nonatomic, weak, readwrite) ABI24_0_0RCTRootShadowView *rootView;

@end
