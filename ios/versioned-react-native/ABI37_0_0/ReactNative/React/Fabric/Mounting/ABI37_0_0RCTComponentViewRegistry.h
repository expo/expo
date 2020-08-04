/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTComponentViewFactory.h>
#import <ABI37_0_0React/ABI37_0_0RCTComponentViewProtocol.h>
#import <ABI37_0_0React/core/ABI37_0_0ReactPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface ABI37_0_0RCTComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) ABI37_0_0RCTComponentViewFactory *componentViewFactory;

/**
 * Returns a native view instance from the recycle pool (or create)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (UIView<ABI37_0_0RCTComponentViewProtocol> *)dequeueComponentViewWithComponentHandle:
                                          (ABI37_0_0facebook::ABI37_0_0React::ComponentHandle)componentHandle
                                                                          tag:(ABI37_0_0ReactTag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(ABI37_0_0facebook::ABI37_0_0React::ComponentHandle)componentHandle
                                            tag:(ABI37_0_0ReactTag)tag
                                  componentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Returns a native component view by given `tag`.
 */
- (UIView<ABI37_0_0RCTComponentViewProtocol> *)componentViewByTag:(ABI37_0_0ReactTag)tag;

/**
 * Returns `tag` associated with given `componentView`.
 */
- (ABI37_0_0ReactTag)tagByComponentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Creates a component view with a given type and puts it to the recycle pool.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(ABI37_0_0facebook::ABI37_0_0React::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
