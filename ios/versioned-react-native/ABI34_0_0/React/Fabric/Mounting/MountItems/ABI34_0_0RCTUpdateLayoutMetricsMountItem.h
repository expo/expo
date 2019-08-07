/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTMountItemProtocol.h>
#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>
#import <ReactABI34_0_0/core/LayoutMetrics.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Updates layout metrics of a component view.
 */
@interface ABI34_0_0RCTUpdateLayoutMetricsMountItem : NSObject <ABI34_0_0RCTMountItemProtocol>

- (instancetype)initWithTag:(ReactABI34_0_0Tag)tag
           oldLayoutMetrics:(facebook::ReactABI34_0_0::LayoutMetrics)oldLayoutMetrics
           newLayoutMetrics:(facebook::ReactABI34_0_0::LayoutMetrics)newLayoutMetrics;

@end

NS_ASSUME_NONNULL_END
