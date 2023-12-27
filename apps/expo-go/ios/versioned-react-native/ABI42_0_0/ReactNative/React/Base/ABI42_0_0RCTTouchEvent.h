/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>

/**
 * Represents a touch event, which may be composed of several touches (one for every finger).
 * For more information on contents of passed data structures see ABI42_0_0RCTTouchHandler.
 */
@interface ABI42_0_0RCTTouchEvent : NSObject <ABI42_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI42_0_0ReactTag:(NSNumber *)ABI42_0_0ReactTag
                     ABI42_0_0ReactTouches:(NSArray<NSDictionary *> *)ABI42_0_0ReactTouches
                   changedIndexes:(NSArray<NSNumber *> *)changedIndexes
                    coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;
@end
