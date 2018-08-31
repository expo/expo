/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>
#import <ReactABI30_0_0/ABI30_0_0RCTInvalidating.h>
#import <ReactABI30_0_0/ABI30_0_0RCTRootView.h>
#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>

/**
 * Posted right before re-render happens. This is a chance for views to invalidate their state so
 * next render cycle will pick up updated views and layout appropriately.
 */
ABI30_0_0RCT_EXTERN NSString *const ABI30_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification;

@class ABI30_0_0RCTLayoutAnimationGroup;
@class ABI30_0_0RCTUIManagerObserverCoordinator;

/**
 * The ABI30_0_0RCTUIManager is the module responsible for updating the view hierarchy.
 */
@interface ABI30_0_0RCTUIManager : NSObject <ABI30_0_0RCTBridgeModule, ABI30_0_0RCTInvalidating>

/**
 * Register a root view tag and creates corresponding `rootView` and
 * `rootShadowView`.
 */
- (void)registerRootViewTag:(NSNumber *)rootTag;

/**
 * Register a root view with the ABI30_0_0RCTUIManager.
 */
- (void)registerRootView:(UIView *)rootView;

/**
 * Gets the view name associated with a ReactABI30_0_0Tag.
 */
- (NSString *)viewNameForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag;

/**
 * Gets the view associated with a ReactABI30_0_0Tag.
 */
- (UIView *)viewForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag;

/**
 * Gets the shadow view associated with a ReactABI30_0_0Tag.
 */
- (ABI30_0_0RCTShadowView *)shadowViewForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag;

/**
 * Set the available size (`availableSize` property) for a root view.
 * This might be used in response to changes in external layout constraints.
 * This value will be directly trasmitted to layout engine and defines how big viewport is;
 * this value does not affect root node size style properties.
 * Can be considered as something similar to `setSize:forView:` but applicable only for root view.
 */
- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView;

/**
 * Sets local data for a shadow view corresponded with given view.
 * In some cases we need a way to specify some environmental data to shadow view
 * to improve layout (or do something similar), so `localData` serves these needs.
 * For example, any stateful embedded native views may benefit from this.
 * Have in mind that this data is not supposed to interfere with the state of
 * the shadow view.
 * Please respect one-directional data flow of ReactABI30_0_0.
 */
- (void)setLocalData:(NSObject *)localData forView:(UIView *)view;

/**
 * Set the size of a view. This might be in response to a screen rotation
 * or some other layout event outside of the ReactABI30_0_0-managed view hierarchy.
 */
- (void)setSize:(CGSize)size forView:(UIView *)view;

/**
 * Set the natural size of a view, which is used when no explicit size is set.
 * Use `UIViewNoIntrinsicMetric` to ignore a dimension.
 * The `size` must NOT include padding and border.
 */
- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize forView:(UIView *)view;

/**
 * Sets up layout animation which will perform on next layout pass.
 * The animation will affect only one next layout pass.
 * Must be called on the main queue.
 */
- (void)setNextLayoutAnimationGroup:(ABI30_0_0RCTLayoutAnimationGroup *)layoutAnimationGroup;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic after all currently queued view updates have completed.
 */
- (void)addUIBlock:(ABI30_0_0RCTViewManagerUIBlock)block;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic before all currently queued view updates have completed.
 */
- (void)prependUIBlock:(ABI30_0_0RCTViewManagerUIBlock)block;

/**
 * Used by native animated module to bypass the process of updating the values through the shadow
 * view hierarchy. This method will directly update native views, which means that updates for
 * layout-related propertied won't be handled properly.
 * Make sure you know what you're doing before calling this method :)
 */
- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ReactABI30_0_0Tag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props;

/**
 * Given a ReactABI30_0_0Tag from a component, find its root view, if possible.
 * Otherwise, this will give back nil.
 *
 * @param ReactABI30_0_0Tag the component tag
 * @param completion the completion block that will hand over the rootView, if any.
 *
 */
- (void)rootViewForReactABI30_0_0Tag:(NSNumber *)ReactABI30_0_0Tag withCompletion:(void (^)(UIView *view))completion;

/**
 * Finds a view that is tagged with nativeID as its nativeID prop
 * with the associated rootTag root tag view hierarchy. Returns the
 * view if found, nil otherwise.
 *
 * @param nativeID the id reference to native component relative to root view.
 * @param rootTag the ReactABI30_0_0 tag of root view hierarchy from which to find the view.
 */
- (UIView *)viewForNativeID:(NSString *)nativeID withRootTag:(NSNumber *)rootTag;

/**
 * The view that is currently first responder, according to the JS context.
 */
+ (UIView *)JSResponder;

/**
 * In some cases we might want to trigger layout from native side.
 * ReactABI30_0_0 won't be aware of this, so we need to make sure it happens.
 */
- (void)setNeedsLayout;

/**
 * Dedicated object for subscribing for UIManager events.
 * See `ABI30_0_0RCTUIManagerObserver` protocol for more details.
 */
@property (atomic, retain, readonly) ABI30_0_0RCTUIManagerObserverCoordinator *observerCoordinator;

@end

/**
 * This category makes the current ABI30_0_0RCTUIManager instance available via the
 * ABI30_0_0RCTBridge, which is useful for ABI30_0_0RCTBridgeModules or ABI30_0_0RCTViewManagers that
 * need to access the ABI30_0_0RCTUIManager.
 */
@interface ABI30_0_0RCTBridge (ABI30_0_0RCTUIManager)

@property (nonatomic, readonly) ABI30_0_0RCTUIManager *uiManager;

@end
