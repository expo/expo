/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTUIManagerUtils.h"

#import "ABI24_0_0RCTAssert.h"

char *const ABI24_0_0RCTUIManagerQueueName = "com.facebook.ReactABI24_0_0.ShadowQueue";

static BOOL pseudoUIManagerQueueFlag = NO;

dispatch_queue_t ABI24_0_0RCTGetUIManagerQueue(void)
{
  static dispatch_queue_t shadowQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if ([NSOperation instancesRespondToSelector:@selector(qualityOfService)]) {
      dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
      shadowQueue = dispatch_queue_create(ABI24_0_0RCTUIManagerQueueName, attr);
    } else {
      shadowQueue = dispatch_queue_create(ABI24_0_0RCTUIManagerQueueName, DISPATCH_QUEUE_SERIAL);
      dispatch_set_target_queue(shadowQueue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0));
    }
  });
  return shadowQueue;
}

BOOL ABI24_0_0RCTIsUIManagerQueue()
{
  static void *queueKey = &queueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(ABI24_0_0RCTGetUIManagerQueue(), queueKey, queueKey, NULL);
  });
  return dispatch_get_specific(queueKey) == queueKey;
}

BOOL ABI24_0_0RCTIsPseudoUIManagerQueue()
{
  if (ABI24_0_0RCTIsMainQueue()) {
    return pseudoUIManagerQueueFlag;
  }

  return NO;
}

void ABI24_0_0RCTExecuteOnUIManagerQueue(dispatch_block_t block)
{
  if (ABI24_0_0RCTIsUIManagerQueue() || ABI24_0_0RCTIsPseudoUIManagerQueue()) {
    block();
  } else {
    dispatch_async(ABI24_0_0RCTGetUIManagerQueue(), ^{
      block();
    });
  }
}

void ABI24_0_0RCTUnsafeExecuteOnUIManagerQueueSync(dispatch_block_t block)
{
  if (ABI24_0_0RCTIsUIManagerQueue() || ABI24_0_0RCTIsPseudoUIManagerQueue()) {
    block();
  } else {
    if (ABI24_0_0RCTIsMainQueue()) {
      dispatch_semaphore_t mainQueueBlockingSemaphore = dispatch_semaphore_create(0);
      dispatch_semaphore_t uiManagerQueueBlockingSemaphore = dispatch_semaphore_create(0);

      // Dispatching block which blocks UI Manager queue.
      dispatch_async(ABI24_0_0RCTGetUIManagerQueue(), ^{
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
      dispatch_sync(ABI24_0_0RCTGetUIManagerQueue(), ^{
        block();
      });
    }
  }
}
