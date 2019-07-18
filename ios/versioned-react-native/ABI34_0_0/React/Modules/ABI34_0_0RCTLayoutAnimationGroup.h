/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>

@class ABI34_0_0RCTLayoutAnimation;

@interface ABI34_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI34_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI34_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI34_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI34_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI34_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI34_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI34_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI34_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI34_0_0RCTResponseSenderBlock)callback;

@end
