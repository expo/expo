/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>

@class ABI30_0_0RCTLayoutAnimation;

@interface ABI30_0_0RCTLayoutAnimationGroup : NSObject

@property (nonatomic, readonly) ABI30_0_0RCTLayoutAnimation *creatingLayoutAnimation;
@property (nonatomic, readonly) ABI30_0_0RCTLayoutAnimation *updatingLayoutAnimation;
@property (nonatomic, readonly) ABI30_0_0RCTLayoutAnimation *deletingLayoutAnimation;

@property (nonatomic, copy) ABI30_0_0RCTResponseSenderBlock callback;

- (instancetype)initWithCreatingLayoutAnimation:(ABI30_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI30_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI30_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI30_0_0RCTResponseSenderBlock)callback;

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI30_0_0RCTResponseSenderBlock)callback;

@end
