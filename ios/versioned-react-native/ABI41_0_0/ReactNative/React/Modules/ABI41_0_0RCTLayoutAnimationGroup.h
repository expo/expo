/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>

@class ABI41_0_0RCTLayoutAnimation;

@interface ABI41_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI41_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI41_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI41_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI41_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI41_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI41_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI41_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI41_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI41_0_0RCTResponseSenderBlock)callback;

@end
