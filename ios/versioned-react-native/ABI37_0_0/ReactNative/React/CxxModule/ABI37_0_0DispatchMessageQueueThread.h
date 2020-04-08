/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <glog/logging.h>

#include <ABI37_0_0React/ABI37_0_0RCTLog.h>
#include <ABI37_0_0cxxreact/ABI37_0_0MessageQueueThread.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

// ABI37_0_0RCTNativeModule arranges for native methods to be invoked on a queue which
// is not the JS thread.  C++ modules don't use ABI37_0_0RCTNativeModule, so this little
// adapter does the work.

class DispatchMessageQueueThread : public MessageQueueThread {
public:
  DispatchMessageQueueThread(ABI37_0_0RCTModuleData *moduleData)
    : moduleData_(moduleData) {}

  void runOnQueue(std::function<void()>&& func) override {
    dispatch_queue_t queue = moduleData_.methodQueue;
    dispatch_block_t block = [func=std::move(func)] { func(); };
    ABI37_0_0RCTAssert(block != nullptr, @"Invalid block generated in call to %@", moduleData_);
    if (queue && block) {
      dispatch_async(queue, block);
    }
  }
  void runOnQueueSync(std::function<void()>&& __unused func) override {
    LOG(FATAL) << "Unsupported operation";
  }
  void quitSynchronous() override {
    LOG(FATAL) << "Unsupported operation";
  }

private:
  ABI37_0_0RCTModuleData *moduleData_;
};

} }
