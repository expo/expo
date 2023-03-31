/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTComponentViewDescriptor.h>
#import <ABI48_0_0React/ABI48_0_0RCTComponentViewFactory.h>
#import <ABI48_0_0React/ABI48_0_0RCTComponentViewProtocol.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/ABI48_0_0ReactPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface ABI48_0_0RCTComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) ABI48_0_0RCTComponentViewFactory *componentViewFactory;

/**
 * Returns a descriptor referring to a native view instance from the recycle pool (or being created on demand)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (ABI48_0_0RCTComponentViewDescriptor const &)dequeueComponentViewWithComponentHandle:
                                          (ABI48_0_0facebook::ABI48_0_0React::ComponentHandle)componentHandle
                                                                          tag:(ABI48_0_0facebook::ABI48_0_0React::Tag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(ABI48_0_0facebook::ABI48_0_0React::ComponentHandle)componentHandle
                                            tag:(ABI48_0_0facebook::ABI48_0_0React::Tag)tag
                        componentViewDescriptor:(ABI48_0_0RCTComponentViewDescriptor)componentViewDescriptor;

/**
 * Returns a component view descriptor by given `tag`.
 */
- (ABI48_0_0RCTComponentViewDescriptor const &)componentViewDescriptorWithTag:(ABI48_0_0facebook::ABI48_0_0React::Tag)tag;

/**
 * Finds a native component view by given `tag`.
 * Returns `nil` if there is no registered component with the `tag`.
 */
- (nullable UIView<ABI48_0_0RCTComponentViewProtocol> *)findComponentViewWithTag:(ABI48_0_0facebook::ABI48_0_0React::Tag)tag;

@end

NS_ASSUME_NONNULL_END
