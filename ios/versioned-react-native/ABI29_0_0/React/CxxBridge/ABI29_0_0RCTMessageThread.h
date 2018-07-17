/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <string>

#import <Foundation/Foundation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI29_0_0/ABI29_0_0MessageQueueThread.h>

namespace facebook {
namespace ReactABI29_0_0 {

class ABI29_0_0RCTMessageThread : public MessageQueueThread {
 public:
  ABI29_0_0RCTMessageThread(NSRunLoop *runLoop, ABI29_0_0RCTJavaScriptCompleteBlock errorBlock);
  ~ABI29_0_0RCTMessageThread() override;
  void runOnQueue(std::function<void()>&&) override;
  void runOnQueueSync(std::function<void()>&&) override;
  void quitSynchronous() override;
  void setRunLoop(NSRunLoop *runLoop);

 private:
  void tryFunc(const std::function<void()>& func);
  void runAsync(std::function<void()> func);
  void runSync(std::function<void()> func);

  CFRunLoopRef m_cfRunLoop;
  ABI29_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::atomic_bool m_shutdown;
};

}
}
