/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string>

#include <cxxReactABI15_0_0/ABI15_0_0MessageQueueThread.h>
#include <dispatch/dispatch.h>

namespace facebook {
namespace ReactABI15_0_0 {

class ABI15_0_0RCTMessageQueue : public MessageQueueThread {
 public:
  explicit ABI15_0_0RCTMessageQueue(const std::string &name);
  void runOnQueue(std::function<void()>&&) override;
  void runOnQueueSync(std::function<void()>&&) override;
  void quitSynchronous() override;

 private:
  dispatch_queue_t m_queue;
  std::atomic_bool m_shutdown;
};

}
}
