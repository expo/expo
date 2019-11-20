/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/core/ReactABI34_0_0Primitives.h>
#import <ReactABI34_0_0/ABI34_0_0RCTMountItemProtocol.h>
#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Deletes (returns to recycle pool) a component view.
 */
@interface ABI34_0_0RCTDeleteMountItem : NSObject <ABI34_0_0RCTMountItemProtocol>

- (instancetype)initWithComponentHandle:(facebook::ReactABI34_0_0::ComponentHandle)componentHandle
                                    tag:(ReactABI34_0_0Tag)tag;

@end

NS_ASSUME_NONNULL_END
