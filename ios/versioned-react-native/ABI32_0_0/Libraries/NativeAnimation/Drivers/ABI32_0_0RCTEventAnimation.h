/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI32_0_0/ABI32_0_0RCTEventDispatcher.h>

#import "ABI32_0_0RCTValueAnimatedNode.h"

@interface ABI32_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI32_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI32_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI32_0_0RCTEvent>)event;

@end
