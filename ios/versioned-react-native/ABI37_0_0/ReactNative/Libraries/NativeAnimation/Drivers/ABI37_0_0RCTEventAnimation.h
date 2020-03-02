/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>

#import "ABI37_0_0RCTValueAnimatedNode.h"

@interface ABI37_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI37_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI37_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI37_0_0RCTEvent>)event;

@end
