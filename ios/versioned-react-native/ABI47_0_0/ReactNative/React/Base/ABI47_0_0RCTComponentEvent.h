/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Generic untyped event for Components. Used internally by ABI47_0_0RCTDirectEventBlock and
 * ABI47_0_0RCTBubblingEventBlock, for other use cases prefer using a class that implements
 * ABI47_0_0RCTEvent to have a type safe way to initialize it.
 */
@interface ABI47_0_0RCTComponentEvent : NSObject <ABI47_0_0RCTEvent>

- (instancetype)initWithName:(NSString *)name viewTag:(NSNumber *)viewTag body:(NSDictionary *)body;

NS_ASSUME_NONNULL_END

@end
