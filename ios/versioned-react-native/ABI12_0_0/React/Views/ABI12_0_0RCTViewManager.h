/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI12_0_0RCTBridgeModule.h"
#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RCTDefines.h"
#import "ABI12_0_0RCTEventDispatcher.h"
#import "ABI12_0_0RCTLog.h"
#import "UIView+ReactABI12_0_0.h"

@class ABI12_0_0RCTBridge;
@class ABI12_0_0RCTShadowView;
@class ABI12_0_0RCTSparseArray;
@class ABI12_0_0RCTUIManager;

typedef void (^ABI12_0_0RCTViewManagerUIBlock)(ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry);

@interface ABI12_0_0RCTViewManager : NSObject <ABI12_0_0RCTBridgeModule>

/**
 * The bridge can be used to access both the ABI12_0_0RCTUIIManager and the ABI12_0_0RCTEventDispatcher,
 * allowing the manager (or the views that it manages) to manipulate the view
 * hierarchy and send events back to the JS context.
 */
@property (nonatomic, weak) ABI12_0_0RCTBridge *bridge;

/**
 * This method instantiates a native view to be managed by the module. Override
 * this to return a custom view instance, which may be preconfigured with default
 * properties, subviews, etc. This method will be called many times, and should
 * return a fresh instance each time. The view module MUST NOT cache the returned
 * view and return the same instance for subsequent calls.
 */
- (UIView *)view;

/**
 * This method instantiates a shadow view to be managed by the module. If omitted,
 * an ordinary ABI12_0_0RCTShadowView instance will be created, which is typically fine for
 * most view types. As with the -view method, the -shadowView method should return
 * a fresh instance each time it is called.
 */
- (ABI12_0_0RCTShadowView *)shadowView;

/**
 * DEPRECATED: declare properties of type ABI12_0_0RCTBubblingEventBlock instead
 *
 * Returns an array of names of events that can be sent by native views. This
 * should return bubbling, directly-dispatched event types. The event name
 * should not include a prefix such as 'on' or 'top', as this will be applied
 * as needed. When subscribing to the event, use the 'Captured' suffix to
 * indicate the captured form, or omit the suffix for the bubbling form.
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customBubblingEventTypes] when overriding it.
 */
- (NSArray<NSString *> *)customBubblingEventTypes __deprecated_msg("Use ABI12_0_0RCTBubblingEventBlock props instead.");

/**
 * DEPRECATED: declare properties of type ABI12_0_0RCTDirectEventBlock instead
 *
 * Returns an array of names of events that can be sent by native views. This
 * should return non-bubbling, directly-dispatched event types. The event name
 * should not include a prefix such as 'on' or 'top', as this will be applied
 * as needed.
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customDirectEventTypes] when overriding it.
 */
- (NSArray<NSString *> *)customDirectEventTypes __deprecated_msg("Use ABI12_0_0RCTDirectEventBlock props instead.");

/**
 * Called to notify manager that layout has finished, in case any calculated
 * properties need to be copied over from shadow view to view.
 */
- (ABI12_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI12_0_0RCTShadowView *)shadowView;

/**
 * Called after view hierarchy manipulation has finished, and all shadow props
 * have been set, but before layout has been performed. Useful for performing
 * custom layout logic or tasks that involve walking the view hierarchy.
 * To be deprecated, hopefully.
 */
- (ABI12_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI12_0_0RCTShadowView *> *)shadowViewRegistry;

/**
 * This handles the simple case, where JS and native property names match.
 */
#define ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(name, type) \
+ (NSArray<NSString *> *)propConfig_##name { return @[@#type]; }

/**
 * This macro maps a named property to an arbitrary key path in the view.
 */
#define ABI12_0_0RCT_REMAP_VIEW_PROPERTY(name, keyPath, type) \
+ (NSArray<NSString *> *)propConfig_##name { return @[@#type, @#keyPath]; }

/**
 * This macro can be used when you need to provide custom logic for setting
 * view properties. The macro should be followed by a method body, which can
 * refer to "json", "view" and "defaultView" to implement the required logic.
 */
#define ABI12_0_0RCT_CUSTOM_VIEW_PROPERTY(name, type, viewClass) \
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(name, __custom__, type)         \
- (void)set_##name:(id)json forView:(viewClass *)view withDefaultView:(viewClass *)defaultView

/**
 * This macro is used to map properties to the shadow view, instead of the view.
 */
#define ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(name, type) \
+ (NSArray<NSString *> *)propConfigShadow_##name { return @[@#type]; }

/**
 * This macro maps a named property to an arbitrary key path in the shadow view.
 */
#define ABI12_0_0RCT_REMAP_SHADOW_PROPERTY(name, keyPath, type) \
+ (NSArray<NSString *> *)propConfigShadow_##name { return @[@#type, @#keyPath]; }

/**
 * This macro can be used when you need to provide custom logic for setting
 * shadow view properties. The macro should be followed by a method body, which can
 * refer to "json" and "view".
 */
#define ABI12_0_0RCT_CUSTOM_SHADOW_PROPERTY(name, type, viewClass) \
ABI12_0_0RCT_REMAP_SHADOW_PROPERTY(name, __custom__, type)         \
- (void)set_##name:(id)json forShadowView:(viewClass *)view

@end
