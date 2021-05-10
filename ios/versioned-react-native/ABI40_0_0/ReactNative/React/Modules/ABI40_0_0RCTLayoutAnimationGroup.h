/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>

@class ABI40_0_0RCTLayoutAnimation;

@interface ABI40_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI40_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI40_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI40_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI40_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI40_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI40_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI40_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI40_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI40_0_0RCTResponseSenderBlock)callback;

@end
