/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>

@class ABI36_0_0RCTLayoutAnimation;

@interface ABI36_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI36_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI36_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI36_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI36_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI36_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI36_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI36_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI36_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI36_0_0RCTResponseSenderBlock)callback;

@end
