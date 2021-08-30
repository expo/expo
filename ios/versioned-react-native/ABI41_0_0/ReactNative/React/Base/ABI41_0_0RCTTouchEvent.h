/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>

/**
 * Represents a touch event, which may be composed of several touches (one for every finger).
 * For more information on contents of passed data structures see ABI41_0_0RCTTouchHandler.
 */
@interface ABI41_0_0RCTTouchEvent : NSObject <ABI41_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI41_0_0ReactTag:(NSNumber *)ABI41_0_0ReactTag
                     ABI41_0_0ReactTouches:(NSArray<NSDictionary *> *)ABI41_0_0ReactTouches
                   changedIndexes:(NSArray<NSNumber *> *)changedIndexes
                    coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;
@end
