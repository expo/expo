/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#pragma once

#import <dispatch/dispatch.h>

namespace facebook {
namespace flipper {
class DispatchQueue {
 public:
  virtual void async(dispatch_block_t block) = 0;
  virtual ~DispatchQueue() {}
};

class GCDQueue : public DispatchQueue {
 public:
  GCDQueue(dispatch_queue_t underlyingQueue)
      : _underlyingQueue(underlyingQueue) {}

  void async(dispatch_block_t block) override {
    dispatch_async(_underlyingQueue, block);
  }

  virtual ~GCDQueue() {}

 private:
  dispatch_queue_t _underlyingQueue;
};
} // namespace flipper
} // namespace facebook

#endif
