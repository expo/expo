/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTComponentViewFactory.h>
#import <ABI36_0_0React/ABI36_0_0RCTComponentViewProtocol.h>
#import <ABI36_0_0React/core/ABI36_0_0ReactPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface ABI36_0_0RCTComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) ABI36_0_0RCTComponentViewFactory *componentViewFactory;

/**
 * Returns a native view instance from the recycle pool (or create)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (UIView<ABI36_0_0RCTComponentViewProtocol> *)dequeueComponentViewWithComponentHandle:
                                          (ABI36_0_0facebook::ABI36_0_0React::ComponentHandle)componentHandle
                                                                          tag:(ABI36_0_0ReactTag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(ABI36_0_0facebook::ABI36_0_0React::ComponentHandle)componentHandle
                                            tag:(ABI36_0_0ReactTag)tag
                                  componentView:(UIView<ABI36_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Returns a native component view by given `tag`.
 */
- (UIView<ABI36_0_0RCTComponentViewProtocol> *)componentViewByTag:(ABI36_0_0ReactTag)tag;

/**
 * Returns `tag` associated with given `componentView`.
 */
- (ABI36_0_0ReactTag)tagByComponentView:(UIView<ABI36_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Creates a component view with a given type and puts it to the recycle pool.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(ABI36_0_0facebook::ABI36_0_0React::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
