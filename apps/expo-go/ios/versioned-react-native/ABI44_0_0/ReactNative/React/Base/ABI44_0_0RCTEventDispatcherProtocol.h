/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTJSInvokerModule.h>

/**
 * The threshold at which text inputs will start warning that the JS thread
 * has fallen behind (resulting in poor input performance, missed keys, etc.)
 */
ABI44_0_0RCT_EXTERN const NSInteger ABI44_0_0RCTTextUpdateLagWarningThreshold;

/**
 * Takes an input event name and normalizes it to the form that is required
 * by the events system (currently that means starting with the "top" prefix,
 * but that's an implementation detail that may change in future).
 */
ABI44_0_0RCT_EXTERN NSString *ABI44_0_0RCTNormalizeInputEventName(NSString *eventName);

typedef NS_ENUM(NSInteger, ABI44_0_0RCTTextEventType) {
  ABI44_0_0RCTTextEventTypeFocus,
  ABI44_0_0RCTTextEventTypeBlur,
  ABI44_0_0RCTTextEventTypeChange,
  ABI44_0_0RCTTextEventTypeSubmit,
  ABI44_0_0RCTTextEventTypeEnd,
  ABI44_0_0RCTTextEventTypeKeyPress
};

@protocol ABI44_0_0RCTEvent <NSObject>
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
- (id<ABI44_0_0RCTEvent>)coalesceWithEvent:(id<ABI44_0_0RCTEvent>)newEvent;

@end

/**
 * This protocol allows observing events dispatched by ABI44_0_0RCTEventDispatcher.
 */
@protocol ABI44_0_0RCTEventDispatcherObserver <NSObject>

/**
 * Called before dispatching an event, on the same thread the event was
 * dispatched from.
 */
- (void)eventDispatcherWillDispatchEvent:(id<ABI44_0_0RCTEvent>)event;

@end

@protocol ABI44_0_0RCTJSDispatcherModule

@property (nonatomic, copy) void (^dispatchToJSThread)(dispatch_block_t block);

@end

/**
 * This class wraps the -[ABI44_0_0RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@protocol ABI44_0_0RCTEventDispatcherProtocol <ABI44_0_0RCTBridgeModule, ABI44_0_0RCTJSDispatcherModule, ABI44_0_0RCTJSInvokerModule>

/**
 * Deprecated, do not use.
 */
- (void)sendAppEventWithName:(NSString *)name body:(id)body __deprecated_msg("Subclass ABI44_0_0RCTEventEmitter instead");

/**
 * Deprecated, do not use.
 */
- (void)sendDeviceEventWithName:(NSString *)name body:(id)body __deprecated_msg("Subclass ABI44_0_0RCTEventEmitter instead");

/**
 * Send a text input/focus event. For internal use only.
 */
- (void)sendTextEventWithType:(ABI44_0_0RCTTextEventType)type
                     ABI44_0_0ReactTag:(NSNumber *)ABI44_0_0ReactTag
                         text:(NSString *)text
                          key:(NSString *)key
                   eventCount:(NSInteger)eventCount;

/**
 * Send a pre-prepared event object.
 *
 * Events are sent to JS as soon as the thread is free to process them.
 * If an event can be coalesced and there is another compatible event waiting, the coalescing will happen immediately.
 */
- (void)sendEvent:(id<ABI44_0_0RCTEvent>)event;

/**
 * Add an event dispatcher observer.
 */
- (void)addDispatchObserver:(id<ABI44_0_0RCTEventDispatcherObserver>)observer;

/**
 * Remove an event dispatcher observer.
 */
- (void)removeDispatchObserver:(id<ABI44_0_0RCTEventDispatcherObserver>)observer;

@end

@interface ABI44_0_0RCTBridge (ABI44_0_0RCTEventDispatcher)

- (id<ABI44_0_0RCTEventDispatcherProtocol>)eventDispatcher;

@end
