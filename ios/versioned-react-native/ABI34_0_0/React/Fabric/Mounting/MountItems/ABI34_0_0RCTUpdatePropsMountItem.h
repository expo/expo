/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTMountItemProtocol.h>
#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>
#import <ReactABI34_0_0/core/Props.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates props of a component view.
 */
@interface ABI34_0_0RCTUpdatePropsMountItem : NSObject <ABI34_0_0RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactABI34_0_0Tag)tag
                   oldProps:(facebook::ReactABI34_0_0::SharedProps)oldProps
                   newProps:(facebook::ReactABI34_0_0::SharedProps)newProps;

@end

NS_ASSUME_NONNULL_END
