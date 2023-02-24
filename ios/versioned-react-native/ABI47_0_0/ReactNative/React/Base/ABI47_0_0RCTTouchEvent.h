/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>

/**
 * Represents a touch event, which may be composed of several touches (one for every finger).
 * For more information on contents of passed data structures see ABI47_0_0RCTTouchHandler.
 */
@interface ABI47_0_0RCTTouchEvent : NSObject <ABI47_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI47_0_0ReactTag:(NSNumber *)ABI47_0_0ReactTag
                     ABI47_0_0ReactTouches:(NSArray<NSDictionary *> *)ABI47_0_0ReactTouches
                   changedIndexes:(NSArray<NSNumber *> *)changedIndexes
                    coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;
@end
