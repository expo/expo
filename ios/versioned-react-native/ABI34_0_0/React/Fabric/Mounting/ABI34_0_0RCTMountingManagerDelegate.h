/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI34_0_0RCTMountingManager;

/**
 * MountingManager's delegate.
 */
@protocol ABI34_0_0RCTMountingManagerDelegate <NSObject>

/*
 * Called right *before* execution of mount items which affect a Surface with
 * given `rootTag`.
 * Always called on the main queue.
 */
- (void)mountingManager:(ABI34_0_0RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactABI34_0_0Tag)MountingManager;

/*
 * Called right *after* execution of mount items which affect a Surface with
 * given `rootTag`.
 * Always called on the main queue.
 */
- (void)mountingManager:(ABI34_0_0RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactABI34_0_0Tag)rootTag;

@end

NS_ASSUME_NONNULL_END
