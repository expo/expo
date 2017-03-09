/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * A simple protocol that any ReactABI15_0_0-managed ViewControllers should implement.
 * We need all of our ViewControllers to cache layoutGuide changes so any View
 * in our View hierarchy can access accurate layoutGuide info at any time.
 */
@protocol ABI15_0_0RCTViewControllerProtocol <NSObject>

@property (nonatomic, readonly, strong) id<UILayoutSupport> currentTopLayoutGuide;
@property (nonatomic, readonly, strong) id<UILayoutSupport> currentBottomLayoutGuide;

@end
