/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI10_0_0RCTValueAnimatedNode.h"
#import "ABI10_0_0RCTEventDispatcher.h"

@interface ABI10_0_0RCTEventAnimationDriver : NSObject

@property (nonatomic, readonly, weak) ABI10_0_0RCTValueAnimatedNode *valueNode;

- (instancetype)initWithEventPath:(NSArray<NSString *> *)eventPath
                        valueNode:(ABI10_0_0RCTValueAnimatedNode *)valueNode;

- (void) updateWithEvent:(id<ABI10_0_0RCTEvent>)event;

@end
