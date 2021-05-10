/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>

#import "ABI39_0_0RCTValueAnimatedNode.h"

@interface ABI39_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI39_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI39_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI39_0_0RCTEvent>)event;

@end
