/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI15_0_0RCTMessageQueue.h"

namespace facebook {
namespace ReactABI15_0_0 {

ABI15_0_0RCTMessageQueue::ABI15_0_0RCTMessageQueue(const std::string &name) {
  m_queue = dispatch_queue_create(name.c_str(), NULL);
}

void ABI15_0_0RCTMessageQueue::runOnQueue(std::function<void()>&& func) {
  if (m_shutdown) {
    return;
  }
  dispatch_async(m_queue, ^{
    if (!m_shutdown) {
      func();
    }
  });
}

void ABI15_0_0RCTMessageQueue::runOnQueueSync(std::function<void()>&& func) {
  if (m_shutdown) {
    return;
  }
  dispatch_sync(m_queue, ^{
    if (!m_shutdown) {
      func();
    }
  });
}

void ABI15_0_0RCTMessageQueue::quitSynchronous() {
  m_shutdown = true;
  dispatch_sync(m_queue, ^{});
}

}
}
