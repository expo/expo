/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI42_0_0React/ABI42_0_0RCTAssert.h>
#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>

/**
 * Queues Problem Intro:
 * UIManager queue is a special queue because it has a special relationship with
 * the Main queue.
 *
 * This particular relationship comes from two key factors:
 *  1. UIManager initiates execution of many blocks on the Main queue;
 *  2. In some cases, we want to initiate (and wait for) some UIManager's work *synchronously* from
 *     the Main queue.
 *
 * So, how can we meet these criteria?
 * "Pseudo UIManager queue" comes to rescue!
 *
 * "Pseudo UIManager queue" means the safe execution of typical UIManager's work
 * on the Main queue while the UIManager queue is explicitly blocked for preventing
 * simultaneous/concurrent memory access.
 *
 * So, how can we technically do this?
 *  1. `ABI42_0_0RCTAssertUIManagerQueue` is okay with execution on both actual UIManager and
 *     Pseudo UIManager queues.
 *  2. Both `ABI42_0_0RCTExecuteOnUIManagerQueue` and `ABI42_0_0RCTUnsafeExecuteOnUIManagerQueueSync`
 *     execute given block *synchronously* if they were called on actual UIManager
 *     or Pseudo UIManager queues.
 *  3. `ABI42_0_0RCTExecuteOnMainQueue` executes given block *synchronously* if we already on
 *     the Main queue.
 *  4. `ABI42_0_0RCTUnsafeExecuteOnUIManagerQueueSync` is smart enough to do the trick:
 *     It detects calling on the Main queue and in this case, instead of doing
 *     trivial *synchronous* dispatch, it does:
 *       - Block the Main queue;
 *       - Dispatch the special block on UIManager queue to block the queue and
 *         concurrent memory access;
 *       - Execute the given block on the Main queue;
 *       - Unblock the UIManager queue.
 *
 * Imagine the analogy: We have two queues: the Main one and UIManager one.
 * And these queues are two lanes of railway that go in parallel. Then,
 * at some point, we merge UIManager lane with the Main lane, and all cars use
 * the unified the Main lane.
 * And then we split lanes again.
 *
 * This solution assumes that the code running on UIManager queue will never
 * *explicitly* block the Main queue via calling `ABI42_0_0RCTUnsafeExecuteOnMainQueueSync`.
 * Otherwise, it can cause a deadlock.
 */

/**
 * Returns UIManager queue.
 */
ABI42_0_0RCT_EXTERN dispatch_queue_t ABI42_0_0RCTGetUIManagerQueue(void);

/**
 * Default name for the UIManager queue.
 */
ABI42_0_0RCT_EXTERN char *const ABI42_0_0RCTUIManagerQueueName;

/**
 * Check if we are currently on UIManager queue.
 * Please do not use this unless you really know what you're doing.
 */
ABI42_0_0RCT_EXTERN BOOL ABI42_0_0RCTIsUIManagerQueue(void);

/**
 * Check if we are currently on Pseudo UIManager queue.
 * Please do not use this unless you really know what you're doing.
 */
ABI42_0_0RCT_EXTERN BOOL ABI42_0_0RCTIsPseudoUIManagerQueue(void);

/**
 * *Asynchronously* executes the specified block on the UIManager queue.
 * Unlike `dispatch_async()` this will execute the block immediately
 * if we're already on the UIManager queue.
 */
ABI42_0_0RCT_EXTERN void ABI42_0_0RCTExecuteOnUIManagerQueue(dispatch_block_t block);

/**
 * *Synchronously* executes the specified block on the UIManager queue.
 * Unlike `dispatch_sync()` this will execute the block immediately
 * if we're already on the UIManager queue.
 * Please do not use this unless you really know what you're doing.
 */
ABI42_0_0RCT_EXTERN void ABI42_0_0RCTUnsafeExecuteOnUIManagerQueueSync(dispatch_block_t block);

/**
 * Convenience macro for asserting that we're running on UIManager queue.
 */
#define ABI42_0_0RCTAssertUIManagerQueue() \
  ABI42_0_0RCTAssert(                      \
      ABI42_0_0RCTIsUIManagerQueue() || ABI42_0_0RCTIsPseudoUIManagerQueue(), @"This function must be called on the UIManager queue")

/**
 * Returns new unique root view tag.
 */
ABI42_0_0RCT_EXTERN NSNumber *ABI42_0_0RCTAllocateRootViewTag(void);
