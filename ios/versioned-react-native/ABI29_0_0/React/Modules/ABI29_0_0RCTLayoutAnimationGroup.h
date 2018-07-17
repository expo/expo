/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>

@class ABI29_0_0RCTLayoutAnimation;

@interface ABI29_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI29_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI29_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI29_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI29_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI29_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI29_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI29_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI29_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI29_0_0RCTResponseSenderBlock)callback;

@end
