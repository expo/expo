/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>

#import "ABI28_0_0RCTValueAnimatedNode.h"

@interface ABI28_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI28_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI28_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI28_0_0RCTEvent>)event;

@end
