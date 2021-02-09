/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>

@class ABI39_0_0RCTLayoutAnimation;

@interface ABI39_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI39_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI39_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI39_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI39_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI39_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI39_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI39_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI39_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI39_0_0RCTResponseSenderBlock)callback;

@end
