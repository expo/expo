/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>

typedef dispatch_block_t ABI29_0_0RCTUIManagerMountingBlock;

/**
 * Allows hooking into UIManager internals. This can be used to execute code at
 * specific points during the view updating process.
 * New observers must not be added inside observer handlers.
 * The particular order of handler invocation is not guaranteed.
 * All observer handlers are called on UIManager queue.
 */
@protocol ABI29_0_0RCTUIManagerObserver <NSObject>

@optional

/**
 * Called just before the UIManager layout views.
 * It allows performing some operation for components which contain custom
 * layout logic right before regular Yoga based layout. So, for instance,
 * some components which have own ReactABI29_0_0-independent state can compute and cache
 * own intrinsic content size (which will be used by Yoga) at this point.
 */
- (void)uiManagerWillPerformLayout:(ABI29_0_0RCTUIManager *)manager;

/**
 * Called just after the UIManager layout views.
 * It allows performing custom layout logic right after regular Yoga based layout.
 * So, for instance, this can be used for computing final layout for a component,
 * since it has its final frame set by Yoga at this point.
 */
- (void)uiManagerDidPerformLayout:(ABI29_0_0RCTUIManager *)manager;

/**
 * Called before flushing UI blocks at the end of a batch.
 * This is called from the UIManager queue. Can be used to add UI operations in that batch.
 */
- (void)uiManagerWillPerformMounting:(ABI29_0_0RCTUIManager *)manager;

/**
 * Called right before flushing UI blocks and allows to intercept the mounting process.
 * Return `YES` to cancel default execution of the `block` (and perform the
 * execution later).
 */
- (BOOL)uiManager:(ABI29_0_0RCTUIManager *)manager performMountingWithBlock:(ABI29_0_0RCTUIManagerMountingBlock)block;

/**
 * Called just after flushing UI blocks.
 * This is called from the UIManager queue.
 */
- (void)uiManagerDidPerformMounting:(ABI29_0_0RCTUIManager *)manager;

@end

/**
 * Simple helper which take care of ABI29_0_0RCTUIManager's observers.
 */
@interface ABI29_0_0RCTUIManagerObserverCoordinator : NSObject <ABI29_0_0RCTUIManagerObserver>

/**
 * Add a UIManagerObserver. See the `ABI29_0_0RCTUIManagerObserver` protocol for more info.
 * References to observers are held weakly.
 * This method can be called safely from any queue.
 */
- (void)addObserver:(id<ABI29_0_0RCTUIManagerObserver>)observer;

/**
 * Remove a `UIManagerObserver`.
 * This method can be called safely from any queue.
 */
- (void)removeObserver:(id<ABI29_0_0RCTUIManagerObserver>)observer;

@end
