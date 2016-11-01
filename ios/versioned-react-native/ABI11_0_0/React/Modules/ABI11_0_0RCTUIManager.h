/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTBridgeModule.h"
#import "ABI11_0_0RCTInvalidating.h"
#import "ABI11_0_0RCTViewManager.h"
#import "ABI11_0_0RCTRootView.h"

/**
 * UIManager queue
 */
ABI11_0_0RCT_EXTERN dispatch_queue_t ABI11_0_0RCTGetUIManagerQueue(void);

/**
 * Default name for the UIManager queue
 */
ABI11_0_0RCT_EXTERN char *const ABI11_0_0RCTUIManagerQueueName;

/**
 * Posted right before re-render happens. This is a chance for views to invalidate their state so
 * next render cycle will pick up updated views and layout appropriately.
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification;

/**
 * Posted whenever a new root view is registered with ABI11_0_0RCTUIManager. The userInfo property
 * will contain a ABI11_0_0RCTUIManagerRootViewKey with the registered root view.
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTUIManagerDidRegisterRootViewNotification;

/**
 * Posted whenever a root view is removed from the ABI11_0_0RCTUIManager. The userInfo property
 * will contain a ABI11_0_0RCTUIManagerRootViewKey with the removed root view.
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTUIManagerDidRemoveRootViewNotification;

/**
 * Key for the root view property in the above notifications
 */
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTUIManagerRootViewKey;

@protocol ABI11_0_0RCTScrollableProtocol;

/**
 * The ABI11_0_0RCTUIManager is the module responsible for updating the view hierarchy.
 */
@interface ABI11_0_0RCTUIManager : NSObject <ABI11_0_0RCTBridgeModule, ABI11_0_0RCTInvalidating>

/**
 * Register a root view with the ABI11_0_0RCTUIManager.
 */
- (void)registerRootView:(UIView *)rootView withSizeFlexibility:(ABI11_0_0RCTRootViewSizeFlexibility)sizeFlexibility;

/**
 * Gets the view associated with a ReactABI11_0_0Tag.
 */
- (UIView *)viewForReactABI11_0_0Tag:(NSNumber *)ReactABI11_0_0Tag;

/**
 * Update the frame of a view. This might be in response to a screen rotation
 * or some other layout event outside of the ReactABI11_0_0-managed view hierarchy.
 */
- (void)setFrame:(CGRect)frame forView:(UIView *)view;

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
- (void)addUIBlock:(ABI11_0_0RCTViewManagerUIBlock)block;

/**
 * Given a ReactABI11_0_0Tag from a component, find its root view, if possible.
 * Otherwise, this will give back nil.
 *
 * @param ReactABI11_0_0Tag the component tag
 * @param completion the completion block that will hand over the rootView, if any.
 *
 */
- (void)rootViewForReactABI11_0_0Tag:(NSNumber *)ReactABI11_0_0Tag withCompletion:(void (^)(UIView *view))completion;

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
 * ReactABI11_0_0 won't be aware of this, so we need to make sure it happens.
 */
- (void)setNeedsLayout;

@end

/**
 * This category makes the current ABI11_0_0RCTUIManager instance available via the
 * ABI11_0_0RCTBridge, which is useful for ABI11_0_0RCTBridgeModules or ABI11_0_0RCTViewManagers that
 * need to access the ABI11_0_0RCTUIManager.
 */
@interface ABI11_0_0RCTBridge (ABI11_0_0RCTUIManager)

@property (nonatomic, readonly) ABI11_0_0RCTUIManager *uiManager;

@end
