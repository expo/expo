/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>

@class ABI32_0_0RCTLayoutAnimation;

@interface ABI32_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI32_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI32_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI32_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI32_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI32_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI32_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI32_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI32_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI32_0_0RCTResponseSenderBlock)callback;

@end
