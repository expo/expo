/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcherProtocol.h>

#import "ABI44_0_0RCTValueAnimatedNode.h"

@interface ABI44_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI44_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI44_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI44_0_0RCTEvent>)event;

@end
