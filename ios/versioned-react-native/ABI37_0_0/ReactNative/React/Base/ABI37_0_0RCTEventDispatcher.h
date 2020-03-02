/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>

typedef NS_ENUM(NSInteger, ABI37_0_0RCTTextEventType)
{
  ABI37_0_0RCTTextEventTypeFocus,
  ABI37_0_0RCTTextEventTypeBlur,
  ABI37_0_0RCTTextEventTypeChange,
  ABI37_0_0RCTTextEventTypeSubmit,
  ABI37_0_0RCTTextEventTypeEnd,
  ABI37_0_0RCTTextEventTypeKeyPress
};

/**
 * The threshold at which text inputs will start warning that the JS thread
 * has fallen behind (resulting in poor input performance, missed keys, etc.)
 */
ABI37_0_0RCT_EXTERN const NSInteger ABI37_0_0RCTTextUpdateLagWarningThreshold;

/**
 * Takes an input event name and normalizes it to the form that is required
 * by the events system (currently that means starting with the "top" prefix,
 * but that's an implementation detail that may change in future).
 */
ABI37_0_0RCT_EXTERN NSString *ABI37_0_0RCTNormalizeInputEventName(NSString *eventName);

@protocol ABI37_0_0RCTEvent <NSObject>
@required

@property (nonatomic, strong, readonly) NSNumber *viewTag;
@property (nonatomic, copy, readonly) NSString *eventName;

- (BOOL)canCoalesce;

/** used directly for doing a JS call */
+ (NSString *)moduleDotMethod;

/** must contain only JSON compatible values */
- (NSArray *)arguments;

@optional

/**
 * Coalescing related methods must only be implemented if canCoalesce
 * returns YES.
 */
@property (nonatomic, assign, readonly) uint16_t coalescingKey;
- (id<ABI37_0_0RCTEvent>)coalesceWithEvent:(id<ABI37_0_0RCTEvent>)newEvent;

@end

/**
 * This protocol allows observing events dispatched by ABI37_0_0RCTEventDispatcher.
 */
@protocol ABI37_0_0RCTEventDispatcherObserver <NSObject>

/**
 * Called before dispatching an event, on the same thread the event was
 * dispatched from.
 */
- (void)eventDispatcherWillDispatchEvent:(id<ABI37_0_0RCTEvent>)event;

@end


/**
 * This class wraps the -[ABI37_0_0RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@interface ABI37_0_0RCTEventDispatcher : NSObject <ABI37_0_0RCTBridgeModule>

/**
 * Deprecated, do not use.
 */
- (void)sendAppEventWithName:(NSString *)name body:(id)body
__deprecated_msg("Subclass ABI37_0_0RCTEventEmitter instead");

/**
 * Deprecated, do not use.
 */
- (void)sendDeviceEventWithName:(NSString *)name body:(id)body
__deprecated_msg("Subclass ABI37_0_0RCTEventEmitter instead");

/**
 * Send a text input/focus event. For internal use only.
 */
- (void)sendTextEventWithType:(ABI37_0_0RCTTextEventType)type
                     ABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
                         text:(NSString *)text
                          key:(NSString *)key
                   eventCount:(NSInteger)eventCount;

/**
 * Send a pre-prepared event object.
 *
 * Events are sent to JS as soon as the thread is free to process them.
 * If an event can be coalesced and there is another compatible event waiting, the coalescing will happen immediately.
 */
- (void)sendEvent:(id<ABI37_0_0RCTEvent>)event;

/**
 * Add an event dispatcher observer.
 */
- (void)addDispatchObserver:(id<ABI37_0_0RCTEventDispatcherObserver>)observer;

/**
 * Remove an event dispatcher observer.
 */
- (void)removeDispatchObserver:(id<ABI37_0_0RCTEventDispatcherObserver>)observer;

@end

@interface ABI37_0_0RCTBridge (ABI37_0_0RCTEventDispatcher)

- (ABI37_0_0RCTEventDispatcher *)eventDispatcher;

@end
