/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>

@class ABI48_0_0RCTLayoutAnimation;

@interface ABI48_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI48_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI48_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI48_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI48_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI48_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI48_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI48_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI48_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI48_0_0RCTResponseSenderBlock)callback;

@end
