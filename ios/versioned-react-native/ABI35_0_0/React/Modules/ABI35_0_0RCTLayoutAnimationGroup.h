/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>

@class ABI35_0_0RCTLayoutAnimation;

@interface ABI35_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI35_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI35_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI35_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI35_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI35_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI35_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI35_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI35_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI35_0_0RCTResponseSenderBlock)callback;

@end
