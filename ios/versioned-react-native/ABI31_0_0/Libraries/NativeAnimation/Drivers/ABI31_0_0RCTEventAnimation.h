/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI31_0_0/ABI31_0_0RCTEventDispatcher.h>

#import "ABI31_0_0RCTValueAnimatedNode.h"

@interface ABI31_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI31_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI31_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI31_0_0RCTEvent>)event;

@end
