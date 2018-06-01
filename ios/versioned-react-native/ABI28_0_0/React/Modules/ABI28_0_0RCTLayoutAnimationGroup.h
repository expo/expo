/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>

@class ABI28_0_0RCTLayoutAnimation;

@interface ABI28_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI28_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI28_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI28_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI28_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI28_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI28_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI28_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI28_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI28_0_0RCTResponseSenderBlock)callback;

@end
