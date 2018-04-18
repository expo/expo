/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>

@class ABI27_0_0RCTLayoutAnimation;

@interface ABI27_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI27_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI27_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI27_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI27_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI27_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI27_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI27_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI27_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI27_0_0RCTResponseSenderBlock)callback;

@end
