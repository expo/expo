/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI5_0_0RCTBridge.h"

typedef NS_ENUM(NSInteger, ABI5_0_0RCTTextEventType) {
  ABI5_0_0RCTTextEventTypeFocus,
  ABI5_0_0RCTTextEventTypeBlur,
  ABI5_0_0RCTTextEventTypeChange,
  ABI5_0_0RCTTextEventTypeSubmit,
  ABI5_0_0RCTTextEventTypeEnd,
  ABI5_0_0RCTTextEventTypeKeyPress
};

typedef NS_ENUM(NSInteger, ABI5_0_0RCTScrollEventType) {
  ABI5_0_0RCTScrollEventTypeStart,
  ABI5_0_0RCTScrollEventTypeMove,
  ABI5_0_0RCTScrollEventTypeEnd,
  ABI5_0_0RCTScrollEventTypeStartDeceleration,
  ABI5_0_0RCTScrollEventTypeEndDeceleration,
  ABI5_0_0RCTScrollEventTypeEndAnimation,
};

/**
 * The threshold at which text inputs will start warning that the JS thread
 * has fallen behind (resulting in poor input performance, missed keys, etc.)
 */
ABI5_0_0RCT_EXTERN const NSInteger ABI5_0_0RCTTextUpdateLagWarningThreshold;

/**
 * Takes an input event name and normalizes it to the form that is required
 * by the events system (currently that means starting with the "top" prefix,
 * but that's an implementation detail that may change in future).
 */
ABI5_0_0RCT_EXTERN NSString *ABI5_0_0RCTNormalizeInputEventName(NSString *eventName);

@protocol ABI5_0_0RCTEvent <NSObject>

@required

@property (nonatomic, strong, readonly) NSNumber *viewTag;
@property (nonatomic, copy, readonly) NSString *eventName;
@property (nonatomic, assign, readonly) uint16_t coalescingKey;

- (BOOL)canCoalesce;
- (id<ABI5_0_0RCTEvent>)coalesceWithEvent:(id<ABI5_0_0RCTEvent>)newEvent;

// used directly for doing a JS call
+ (NSString *)moduleDotMethod;
// must contain only JSON compatible values
- (NSArray *)arguments;

@end


/**
 * This class wraps the -[ABI5_0_0RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@interface ABI5_0_0RCTEventDispatcher : NSObject <ABI5_0_0RCTBridgeModule>

/**
 * Send an application-specific event that does not relate to a specific
 * view, e.g. a navigation or data update notification.
 */
- (void)sendAppEventWithName:(NSString *)name body:(id)body;

/**
 * Send a device or iOS event that does not relate to a specific view,
 * e.g.rotation, location, keyboard show/hide, background/awake, etc.
 */
- (void)sendDeviceEventWithName:(NSString *)name body:(id)body;

/**
 * Send a user input event. The body dictionary must contain a "target"
 * parameter, representing the ReactABI5_0_0 tag of the view sending the event
 */
- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body;

/**
 * Send a text input/focus event.
 */
- (void)sendTextEventWithType:(ABI5_0_0RCTTextEventType)type
                     ReactABI5_0_0Tag:(NSNumber *)ReactABI5_0_0Tag
                         text:(NSString *)text
                          key:(NSString *)key
                   eventCount:(NSInteger)eventCount;

/**
 * Send a pre-prepared event object.
 *
 * Events are sent to JS as soon as the thread is free to process them.
 * If an event can be coalesced and there is another compatible event waiting, the coalescing will happen immediately.
 */
- (void)sendEvent:(id<ABI5_0_0RCTEvent>)event;

@end
