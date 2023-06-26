/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

@class ABI49_0_0RCTLayoutAnimation;

@interface ABI49_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI49_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI49_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI49_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI49_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI49_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI49_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI49_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI49_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI49_0_0RCTResponseSenderBlock)callback;

@end
