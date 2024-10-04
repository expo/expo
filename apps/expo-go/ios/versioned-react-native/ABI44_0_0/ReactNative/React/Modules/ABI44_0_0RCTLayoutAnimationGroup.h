/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>

@class ABI44_0_0RCTLayoutAnimation;

@interface ABI44_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI44_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI44_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI44_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI44_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI44_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI44_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI44_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI44_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI44_0_0RCTResponseSenderBlock)callback;

@end
