/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <string>

#import <Foundation/Foundation.h>

#import <ReactABI17_0_0/ABI17_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI17_0_0/ABI17_0_0MessageQueueThread.h>

namespace facebook {
namespace ReactABI17_0_0 {

class ABI17_0_0RCTMessageThread : public MessageQueueThread {
 public:
  ABI17_0_0RCTMessageThread(NSRunLoop *runLoop, ABI17_0_0RCTJavaScriptCompleteBlock errorBlock);
  ~ABI17_0_0RCTMessageThread() override;
  void runOnQueue(std::function<void()>&&) override;
  void runOnQueueSync(std::function<void()>&&) override;
  void quitSynchronous() override;

 private:
  void tryFunc(const std::function<void()>& func);
  void runAsync(std::function<void()> func);
  void runSync(std::function<void()> func);

  CFRunLoopRef m_cfRunLoop;
  ABI17_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::atomic_bool m_shutdown;
};

}
}
