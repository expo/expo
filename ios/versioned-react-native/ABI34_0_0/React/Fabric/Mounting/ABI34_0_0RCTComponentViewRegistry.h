/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTComponentViewFactory.h>
#import <ReactABI34_0_0/ABI34_0_0RCTComponentViewProtocol.h>
#import <ReactABI34_0_0/core/ReactABI34_0_0Primitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface ABI34_0_0RCTComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) ABI34_0_0RCTComponentViewFactory *componentViewFactory;

/**
 * Returns a native view instance from the recycle pool (or create)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (UIView<ABI34_0_0RCTComponentViewProtocol> *)dequeueComponentViewWithComponentHandle:
                                          (facebook::ReactABI34_0_0::ComponentHandle)componentHandle
                                                                          tag:(ReactABI34_0_0Tag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(facebook::ReactABI34_0_0::ComponentHandle)componentHandle
                                            tag:(ReactABI34_0_0Tag)tag
                                  componentView:(UIView<ABI34_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Returns a native component view by given `tag`.
 */
- (UIView<ABI34_0_0RCTComponentViewProtocol> *)componentViewByTag:(ReactABI34_0_0Tag)tag;

/**
 * Returns `tag` assosiated with given `componentView`.
 */
- (ReactABI34_0_0Tag)tagByComponentView:(UIView<ABI34_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Creates a component view with a given type and puts it to the recycle pool.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(facebook::ReactABI34_0_0::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
