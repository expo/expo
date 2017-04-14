/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <ReactABI16_0_0/ABI16_0_0RCTBridgeModule.h>
#import <ReactABI16_0_0/ABI16_0_0RCTInvalidating.h>
#import <ReactABI16_0_0/ABI16_0_0RCTRootView.h>
#import <ReactABI16_0_0/ABI16_0_0RCTViewManager.h>

/**
 * UIManager queue
 */
ABI16_0_0RCT_EXTERN dispatch_queue_t ABI16_0_0RCTGetUIManagerQueue(void);

/**
 * Default name for the UIManager queue
 */
ABI16_0_0RCT_EXTERN char *const ABI16_0_0RCTUIManagerQueueName;

/**
 * Posted right before re-render happens. This is a chance for views to invalidate their state so
 * next render cycle will pick up updated views and layout appropriately.
 */
ABI16_0_0RCT_EXTERN NSString *const ABI16_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification;

/**
 * Posted whenever a new root view is registered with ABI16_0_0RCTUIManager. The userInfo property
 * will contain a ABI16_0_0RCTUIManagerRootViewKey with the registered root view.
 */
ABI16_0_0RCT_EXTERN NSString *const ABI16_0_0RCTUIManagerDidRegisterRootViewNotification;

/**
 * Posted whenever a root view is removed from the ABI16_0_0RCTUIManager. The userInfo property
 * will contain a ABI16_0_0RCTUIManagerRootViewKey with the removed root view.
 */
ABI16_0_0RCT_EXTERN NSString *const ABI16_0_0RCTUIManagerDidRemoveRootViewNotification;

/**
 * Key for the root view property in the above notifications
 */
ABI16_0_0RCT_EXTERN NSString *const ABI16_0_0RCTUIManagerRootViewKey;

@protocol ABI16_0_0RCTScrollableProtocol;

/**
 * The ABI16_0_0RCTUIManager is the module responsible for updating the view hierarchy.
 */
@interface ABI16_0_0RCTUIManager : NSObject <ABI16_0_0RCTBridgeModule, ABI16_0_0RCTInvalidating>

/**
 * Register a root view with the ABI16_0_0RCTUIManager.
 */
- (void)registerRootView:(UIView *)rootView;

/**
 * Gets the view name associated with a ReactABI16_0_0Tag.
 */
- (NSString *)viewNameForReactABI16_0_0Tag:(NSNumber *)ReactABI16_0_0Tag;

/**
 * Gets the view associated with a ReactABI16_0_0Tag.
 */
- (UIView *)viewForReactABI16_0_0Tag:(NSNumber *)ReactABI16_0_0Tag;

/**
 * Set the available size (`availableSize` property) for a root view.
 * This might be used in response to changes in external layout constraints.
 * This value will be directly trasmitted to layout engine and defines how big viewport is;
 * this value does not affect root node size style properties.
 * Can be considered as something similar to `setSize:forView:` but applicable only for root view.
 */
- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView;

/**
 * Set the size of a view. This might be in response to a screen rotation
 * or some other layout event outside of the ReactABI16_0_0-managed view hierarchy.
 */
- (void)setSize:(CGSize)size forView:(UIView *)view;

/**
 * Set the natural size of a view, which is used when no explicit size is set.
 * Use UIViewNoIntrinsicMetric to ignore a dimension.
 */
- (void)setIntrinsicContentSize:(CGSize)size forView:(UIView *)view;

/**
 * Update the background color of a view. The source of truth for
 * backgroundColor is the shadow view, so if to update backgroundColor from
 * native code you will need to call this method.
 */
- (void)setBackgroundColor:(UIColor *)color forView:(UIView *)view;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic after all currently queued view updates have completed.
 */
- (void)addUIBlock:(ABI16_0_0RCTViewManagerUIBlock)block;

/**
 * Used by native animated module to bypass the process of updating the values through the shadow
 * view hierarchy. This method will directly update native views, which means that updates for
 * layout-related propertied won't be handled properly.
 * Make sure you know what you're doing before calling this method :)
 */
- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ReactABI16_0_0Tag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props;

/**
 * Given a ReactABI16_0_0Tag from a component, find its root view, if possible.
 * Otherwise, this will give back nil.
 *
 * @param ReactABI16_0_0Tag the component tag
 * @param completion the completion block that will hand over the rootView, if any.
 *
 */
- (void)rootViewForReactABI16_0_0Tag:(NSNumber *)ReactABI16_0_0Tag withCompletion:(void (^)(UIView *view))completion;

/**
 * The view that is currently first responder, according to the JS context.
 */
+ (UIView *)JSResponder;

/**
 * Normally, UI changes are not applied until the complete batch of method
 * invocations from JavaScript to native has completed.
 *
 * Setting this to YES will flush UI changes sooner, which could potentially
 * result in inconsistent UI updates.
 *
 * The default is NO (recommended).
 */
@property (atomic, assign) BOOL unsafeFlushUIChangesBeforeBatchEnds;

/**
 * In some cases we might want to trigger layout from native side.
 * ReactABI16_0_0 won't be aware of this, so we need to make sure it happens.
 */
- (void)setNeedsLayout;

@end

@interface ABI16_0_0RCTUIManager (Deprecated)

/**
 * This method is deprecated and will be removed in next releases.
 * Use `setSize:forView:` or `setIntrinsicContentSize:forView:` instead.
 * Only frames with `origin` equals {0, 0} are supported.
 */
- (void)setFrame:(CGRect)frame forView:(UIView *)view
__deprecated_msg("Use `setSize:forView:` or `setIntrinsicContentSize:forView:` instead.");


/**
 * This method is deprecated and will be removed in next releases.
 * Use `registerRootView:` instead. There is no need to specify `sizeFlexibility` anymore.
 */
- (void)registerRootView:(UIView *)rootView withSizeFlexibility:(ABI16_0_0RCTRootViewSizeFlexibility)sizeFlexibility
__deprecated_msg("Use `registerRootView:` instead.");

@end

/**
 * This category makes the current ABI16_0_0RCTUIManager instance available via the
 * ABI16_0_0RCTBridge, which is useful for ABI16_0_0RCTBridgeModules or ABI16_0_0RCTViewManagers that
 * need to access the ABI16_0_0RCTUIManager.
 */
@interface ABI16_0_0RCTBridge (ABI16_0_0RCTUIManager)

@property (nonatomic, readonly) ABI16_0_0RCTUIManager *uiManager;

@end
