/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTInvalidating.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootView.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

/**
 * Posted right before re-render happens. This is a chance for views to invalidate their state so
 * next render cycle will pick up updated views and layout appropriately.
 */
ABI49_0_0RCT_EXTERN NSString *const ABI49_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification;

@class ABI49_0_0RCTLayoutAnimationGroup;
@class ABI49_0_0RCTUIManagerObserverCoordinator;

/**
 * The ABI49_0_0RCTUIManager is the module responsible for updating the view hierarchy.
 */
@interface ABI49_0_0RCTUIManager : NSObject <ABI49_0_0RCTBridgeModule, ABI49_0_0RCTInvalidating>

/**
 * Register a root view tag and creates corresponding `rootView` and
 * `rootShadowView`.
 */
- (void)registerRootViewTag:(NSNumber *)rootTag;

/**
 * Register a root view with the ABI49_0_0RCTUIManager.
 */
- (void)registerRootView:(UIView *)rootView;

/**
 * Gets the view name associated with a ABI49_0_0ReactTag.
 */
- (NSString *)viewNameForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag;

/**
 * Gets the view associated with a ABI49_0_0ReactTag.
 */
- (UIView *)viewForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag;

/**
 * Gets the shadow view associated with a ABI49_0_0ReactTag.
 */
- (ABI49_0_0RCTShadowView *)shadowViewForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag;

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
 * Please respect one-directional data flow of ABI49_0_0React.
 */
- (void)setLocalData:(NSObject *)localData forView:(UIView *)view;

/**
 * Set the size of a view. This might be in response to a screen rotation
 * or some other layout event outside of the ABI49_0_0React-managed view hierarchy.
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
- (void)setNextLayoutAnimationGroup:(ABI49_0_0RCTLayoutAnimationGroup *)layoutAnimationGroup;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic after all currently queued view updates have completed.
 */
- (void)addUIBlock:(ABI49_0_0RCTViewManagerUIBlock)block;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic before all currently queued view updates have completed.
 */
- (void)prependUIBlock:(ABI49_0_0RCTViewManagerUIBlock)block;

/**
 * Used by native animated module to bypass the process of updating the values through the shadow
 * view hierarchy. This method will directly update native views, which means that updates for
 * layout-related propertied won't be handled properly.
 * Make sure you know what you're doing before calling this method :)
 */
- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI49_0_0ReactTag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props;

/**
 * Given a ABI49_0_0ReactTag from a component, find its root view, if possible.
 * Otherwise, this will give back nil.
 *
 * @param ABI49_0_0ReactTag the component tag
 * @param completion the completion block that will hand over the rootView, if any.
 *
 */
- (void)rootViewForABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag withCompletion:(void (^)(UIView *view))completion;

/**
 * Finds a view that is tagged with nativeID as its nativeID prop
 * with the associated rootTag root tag view hierarchy. Returns the
 * view if found, nil otherwise.
 *
 * @param nativeID the id reference to native component relative to root view.
 * @param rootTag the ABI49_0_0React tag of root view hierarchy from which to find the view.
 */
- (UIView *)viewForNativeID:(NSString *)nativeID withRootTag:(NSNumber *)rootTag;

/**
 * Register a view that is tagged with nativeID as its nativeID prop
 *
 * @param nativeID the id reference to native component relative to root view.
 * @param view the view that is tagged with nativeID as its nativeID prop.
 */
- (void)setNativeID:(NSString *)nativeID forView:(UIView *)view;

/**
 * The view that is currently first responder, according to the JS context.
 */
+ (UIView *)JSResponder;

/**
 * In some cases we might want to trigger layout from native side.
 * ABI49_0_0React won't be aware of this, so we need to make sure it happens.
 */
- (void)setNeedsLayout;

/**
 * Dedicated object for subscribing for UIManager events.
 * See `ABI49_0_0RCTUIManagerObserver` protocol for more details.
 */
@property (atomic, retain, readonly) ABI49_0_0RCTUIManagerObserverCoordinator *observerCoordinator;

@end

/**
 * This category makes the current ABI49_0_0RCTUIManager instance available via the
 * ABI49_0_0RCTBridge, which is useful for ABI49_0_0RCTBridgeModules or ABI49_0_0RCTViewManagers that
 * need to access the ABI49_0_0RCTUIManager.
 */
@interface ABI49_0_0RCTBridge (ABI49_0_0RCTUIManager)

@property (nonatomic, readonly) ABI49_0_0RCTUIManager *uiManager;

@end
