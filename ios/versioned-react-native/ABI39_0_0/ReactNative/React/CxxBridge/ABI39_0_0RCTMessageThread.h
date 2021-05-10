/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <string>

#import <Foundation/Foundation.h>

#import <ABI39_0_0React/ABI39_0_0RCTJavaScriptExecutor.h>
#import <ABI39_0_0cxxreact/ABI39_0_0MessageQueueThread.h>

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

class ABI39_0_0RCTMessageThread : public MessageQueueThread {
 public:
  ABI39_0_0RCTMessageThread(NSRunLoop *runLoop, ABI39_0_0RCTJavaScriptCompleteBlock errorBlock);
  ~ABI39_0_0RCTMessageThread() override;
  void runOnQueue(std::function<void()> &&) override;
  void runOnQueueSync(std::function<void()> &&) override;
  void quitSynchronous() override;
  void setRunLoop(NSRunLoop *runLoop);

 private:
  void tryFunc(const std::function<void()> &func);
  void runAsync(std::function<void()> func);
  void runSync(std::function<void()> func);

  CFRunLoopRef m_cfRunLoop;
  ABI39_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::atomic_bool m_shutdown;
};

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook
