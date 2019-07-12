/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>

/**
 * Represents a touch event, which may be composed of several touches (one for every finger).
 * For more information on contents of passed data structures see ABI34_0_0RCTTouchHandler.
 */
@interface ABI34_0_0RCTTouchEvent : NSObject <ABI34_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ReactABI34_0_0Tag:(NSNumber *)ReactABI34_0_0Tag
                     ReactABI34_0_0Touches:(NSArray<NSDictionary *> *)ReactABI34_0_0Touches
                   changedIndexes:(NSArray<NSNumber *> *)changedIndexes
                    coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;
@end
