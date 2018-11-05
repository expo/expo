/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTUIManagerUtils.h"

#import <libkern/OSAtomic.h>

#import "ABI28_0_0RCTAssert.h"

char *const ABI28_0_0RCTUIManagerQueueName = "com.facebook.ReactABI28_0_0.ShadowQueue";

static BOOL pseudoUIManagerQueueFlag = NO;

dispatch_queue_t ABI28_0_0RCTGetUIManagerQueue(void)
{
  static dispatch_queue_t shadowQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if ([NSOperation instancesRespondToSelector:@selector(qualityOfService)]) {
      dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
      shadowQueue = dispatch_queue_create(ABI28_0_0RCTUIManagerQueueName, attr);
    } else {
      shadowQueue = dispatch_queue_create(ABI28_0_0RCTUIManagerQueueName, DISPATCH_QUEUE_SERIAL);
      dispatch_set_target_queue(shadowQueue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0));
    }
  });
  return shadowQueue;
}

BOOL ABI28_0_0RCTIsUIManagerQueue()
{
  static void *queueKey = &queueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(ABI28_0_0RCTGetUIManagerQueue(), queueKey, queueKey, NULL);
  });
  return dispatch_get_specific(queueKey) == queueKey;
}

BOOL ABI28_0_0RCTIsPseudoUIManagerQueue()
{
  if (ABI28_0_0RCTIsMainQueue()) {
    return pseudoUIManagerQueueFlag;
  }

  return NO;
}

void ABI28_0_0RCTExecuteOnUIManagerQueue(dispatch_block_t block)
{
  if (ABI28_0_0RCTIsUIManagerQueue() || ABI28_0_0RCTIsPseudoUIManagerQueue()) {
    block();
  } else {
    dispatch_async(ABI28_0_0RCTGetUIManagerQueue(), ^{
      block();
    });
  }
}

void ABI28_0_0RCTUnsafeExecuteOnUIManagerQueueSync(dispatch_block_t block)
{
  if (ABI28_0_0RCTIsUIManagerQueue() || ABI28_0_0RCTIsPseudoUIManagerQueue()) {
    block();
  } else {
    if (ABI28_0_0RCTIsMainQueue()) {
      dispatch_semaphore_t mainQueueBlockingSemaphore = dispatch_semaphore_create(0);
      dispatch_semaphore_t uiManagerQueueBlockingSemaphore = dispatch_semaphore_create(0);

      // Dispatching block which blocks UI Manager queue.
      dispatch_async(ABI28_0_0RCTGetUIManagerQueue(), ^{
        // Initiating `block` execution on main queue.
        dispatch_semaphore_signal(mainQueueBlockingSemaphore);
        // Waiting for finishing `block`.
        dispatch_semaphore_wait(uiManagerQueueBlockingSemaphore, DISPATCH_TIME_FOREVER);
      });

      // Waiting for block on UIManager queue.
      dispatch_semaphore_wait(mainQueueBlockingSemaphore, DISPATCH_TIME_FOREVER);
      pseudoUIManagerQueueFlag = YES;
      // `block` execution while UIManager queue is blocked by semaphore.
      block();
      pseudoUIManagerQueueFlag = NO;
      // Signalling UIManager block.
      dispatch_semaphore_signal(uiManagerQueueBlockingSemaphore);
    } else {
      dispatch_sync(ABI28_0_0RCTGetUIManagerQueue(), ^{
        block();
      });
    }
  }
}

NSNumber *ABI28_0_0RCTAllocateRootViewTag()
{
  // Numbering of these tags goes from 1, 11, 21, 31, ..., 100501, ...
  static int64_t rootViewTagCounter = -1;
  return @(OSAtomicIncrement64(&rootViewTagCounter) * 10 + 1);
}
