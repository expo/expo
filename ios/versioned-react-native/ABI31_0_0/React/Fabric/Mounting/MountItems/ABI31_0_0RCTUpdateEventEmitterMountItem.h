/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTMountItemProtocol.h>
#import <ReactABI31_0_0/ABI31_0_0RCTPrimitives.h>
#import <ABI31_0_0fabric/ABI31_0_0events/EventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates event handlers of a component view.
 */
@interface ABI31_0_0RCTUpdateEventEmitterMountItem : NSObject <ABI31_0_0RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactABI31_0_0Tag)tag
              eventEmitter:(facebook::ReactABI31_0_0::SharedEventEmitter)eventEmitter;

@end

NS_ASSUME_NONNULL_END
