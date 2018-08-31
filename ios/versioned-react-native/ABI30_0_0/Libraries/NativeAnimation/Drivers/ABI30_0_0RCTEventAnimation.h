/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>

#import "ABI30_0_0RCTValueAnimatedNode.h"

@interface ABI30_0_0RCTEventAnimation : NSObject

@property (nonatomic, readonly, weak) ABI30_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI30_0_0RCTValueAnimatedNode *)valueNode;

- (void)updateWithEvent:(id<ABI30_0_0RCTEvent>)event;

@end
