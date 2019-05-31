/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI33_0_0/ABI33_0_0RCTMountItemProtocol.h>
#import <ReactABI33_0_0/ABI33_0_0RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Removes a component view from another component view.
 */
@interface ABI33_0_0RCTRemoveMountItem : NSObject <ABI33_0_0RCTMountItemProtocol>

- (instancetype)initWithChildTag:(ReactABI33_0_0Tag)childTag
                       parentTag:(ReactABI33_0_0Tag)parentTag
                           index:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
