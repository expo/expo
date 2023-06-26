/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcherProtocol.h>

#import "ABI49_0_0RCTValueAnimatedNode.h"

@interface ABI49_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI49_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath valueNode:(ABI49_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI49_0_0RCTEvent>)event;

@end
