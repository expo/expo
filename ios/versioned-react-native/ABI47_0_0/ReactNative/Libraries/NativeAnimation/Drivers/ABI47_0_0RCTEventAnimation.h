/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>

#import "ABI47_0_0RCTValueAnimatedNode.h"

@interface ABI47_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI47_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI47_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI47_0_0RCTEvent>)event;

@end
