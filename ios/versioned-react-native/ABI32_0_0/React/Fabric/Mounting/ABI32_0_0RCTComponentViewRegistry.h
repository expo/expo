/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface ABI32_0_0RCTComponentViewRegistry : NSObject

/**
 * Returns a native view instance from the recycle pool (or create)
 * for given `componentName` and with given `tag`.
 * #RefuseSingleUse
 */
- (UIView<ABI32_0_0RCTComponentViewProtocol> *)dequeueComponentViewWithName:(NSString *)componentName
                                                               tag:(ReactABI32_0_0Tag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithName:(NSString *)componentName
                                 tag:(ReactABI32_0_0Tag)tag
                       componentView:(UIView<ABI32_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Returns a native component view by given `tag`.
 */
- (UIView<ABI32_0_0RCTComponentViewProtocol> *)componentViewByTag:(ReactABI32_0_0Tag)tag;

/**
 * Returns `tag` assosiated with given `componentView`.
 */
- (ReactABI32_0_0Tag)tagByComponentView:(UIView<ABI32_0_0RCTComponentViewProtocol> *)componentView;

/**
 * Creates a component view with a given type and puts it to the recycle pool.
 */
- (void)preliminaryCreateComponentViewWithName:(NSString *)componentName;

@end

NS_ASSUME_NONNULL_END
