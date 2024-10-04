/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTComponent.h>
#import <UIKit/UIKit.h>

/**
 * Protocol used to dispatch commands in `ABI42_0_0RCTRefreshControlManager.h`.
 * This is in order to support commands for both Paper and Fabric components
 * during migration.
 */
@protocol ABI42_0_0RCTRefreshableProtocol

- (void)setRefreshing:(BOOL)refreshing;

@end
