/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTRootView.h"

/**
 * The interface provides a set of functions that allow other internal framework
 * classes to change the ABI8_0_0RCTRootViews's internal state.
 */
@interface ABI8_0_0RCTRootView ()

/**
 * This setter should be used only by ABI8_0_0RCTUIManager on ReactABI8_0_0 root view size update.
 */
@property (readwrite, nonatomic, assign) CGSize intrinsicSize;

@end
