/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI34_0_0RCTComponentViewRegistry;

/**
 * Granular representation of any change in a user interface.
 */
@protocol ABI34_0_0RCTMountItemProtocol <NSObject>

- (void)executeWithRegistry:(ABI34_0_0RCTComponentViewRegistry *)registry;

@end

NS_ASSUME_NONNULL_END
