/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTComponentViewDescriptor.h>
#import <ABI42_0_0React/ABI42_0_0RCTComponentViewFactory.h>
#import <ABI42_0_0React/ABI42_0_0RCTComponentViewProtocol.h>
#import <ABI42_0_0React/core/ABI42_0_0ReactPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface ABI42_0_0RCTComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) ABI42_0_0RCTComponentViewFactory *componentViewFactory;

/**
 * Returns a descriptor referring to a native view instance from the recycle pool (or being created on demand)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (ABI42_0_0RCTComponentViewDescriptor)dequeueComponentViewWithComponentHandle:(ABI42_0_0facebook::ABI42_0_0React::ComponentHandle)componentHandle
                                                                  tag:(ABI42_0_0facebook::ABI42_0_0React::Tag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(ABI42_0_0facebook::ABI42_0_0React::ComponentHandle)componentHandle
                                            tag:(ABI42_0_0facebook::ABI42_0_0React::Tag)tag
                        componentViewDescriptor:(ABI42_0_0RCTComponentViewDescriptor)componentViewDescriptor;

/**
 * Returns a component view descriptor by given `tag`.
 */
- (ABI42_0_0RCTComponentViewDescriptor const &)componentViewDescriptorWithTag:(ABI42_0_0facebook::ABI42_0_0React::Tag)tag;

/**
 * Finds a native component view by given `tag`.
 * Returns `nil` if there is no registered component with the `tag`.
 */
- (nullable UIView<ABI42_0_0RCTComponentViewProtocol> *)findComponentViewWithTag:(ABI42_0_0facebook::ABI42_0_0React::Tag)tag;

/**
 * Creates a component view with a given type and puts it to the recycle pool.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(ABI42_0_0facebook::ABI42_0_0React::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
