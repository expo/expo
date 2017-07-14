/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <ReactABI19_0_0/ABI19_0_0RCTLog.h>
#include <cxxReactABI19_0_0/ABI19_0_0MessageQueueThread.h>

namespace facebook {
namespace ReactABI19_0_0 {

// ABI19_0_0RCTNativeModule arranges for native methods to be invoked on a queue which
// is not the JS thread.  C++ modules don't use ABI19_0_0RCTNativeModule, so this little
// adapter does the work.

class DispatchMessageQueueThread : public MessageQueueThread {
public:
  DispatchMessageQueueThread(ABI19_0_0RCTModuleData *moduleData)
    : moduleData_(moduleData) {}

  void runOnQueue(std::function<void()>&& func) override {
    dispatch_queue_t queue = moduleData_.methodQueue;
    ABI19_0_0RCTAssert(queue != nullptr, @"Module %@ provided invalid queue", moduleData_);
    dispatch_block_t block = [func=std::move(func)] { func(); };
    ABI19_0_0RCTAssert(block != nullptr, @"Invalid block generated in call to %@", moduleData_);
    if (queue && block) {
      dispatch_async(queue, block);
    }
  }
  void runOnQueueSync(std::function<void()>&& func) override {
    LOG(FATAL) << "Unsupported operation";
  }
  void quitSynchronous() override {
    LOG(FATAL) << "Unsupported operation";
  }

private:
  ABI19_0_0RCTModuleData *moduleData_;
};

} }
