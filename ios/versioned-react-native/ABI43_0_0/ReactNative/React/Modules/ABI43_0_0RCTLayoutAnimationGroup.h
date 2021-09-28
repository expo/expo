/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>

@class ABI43_0_0RCTLayoutAnimation;

@interface ABI43_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI43_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI43_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI43_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI43_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI43_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI43_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI43_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI43_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI43_0_0RCTResponseSenderBlock)callback;

@end
