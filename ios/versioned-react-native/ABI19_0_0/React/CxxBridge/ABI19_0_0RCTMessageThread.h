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

#import <ReactABI19_0_0/ABI19_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI19_0_0/ABI19_0_0MessageQueueThread.h>

namespace facebook {
namespace ReactABI19_0_0 {

class ABI19_0_0RCTMessageThread : public MessageQueueThread {
 public:
  ABI19_0_0RCTMessageThread(NSRunLoop *runLoop, ABI19_0_0RCTJavaScriptCompleteBlock errorBlock);
  ~ABI19_0_0RCTMessageThread() override;
  void runOnQueue(std::function<void()>&&) override;
  void runOnQueueSync(std::function<void()>&&) override;
  void quitSynchronous() override;
  void setRunLoop(NSRunLoop *runLoop);

 private:
  void tryFunc(const std::function<void()>& func);
  void runAsync(std::function<void()> func);
  void runSync(std::function<void()> func);

  CFRunLoopRef m_cfRunLoop;
  ABI19_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::atomic_bool m_shutdown;
};

}
}
