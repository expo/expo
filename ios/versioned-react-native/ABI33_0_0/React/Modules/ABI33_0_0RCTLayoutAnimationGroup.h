/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>

@class ABI33_0_0RCTLayoutAnimation;

@interface ABI33_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI33_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI33_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI33_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI33_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI33_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI33_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI33_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI33_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI33_0_0RCTResponseSenderBlock)callback;

@end
