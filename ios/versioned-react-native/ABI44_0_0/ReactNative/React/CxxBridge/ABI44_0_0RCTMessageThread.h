/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <memory>
#import <string>

#import <Foundation/Foundation.h>

#import <ABI44_0_0React/ABI44_0_0RCTJavaScriptExecutor.h>
#import <ABI44_0_0cxxreact/ABI44_0_0MessageQueueThread.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class ABI44_0_0RCTMessageThread : public MessageQueueThread,
                         public std::enable_shared_from_this<ABI44_0_0RCTMessageThread> {
 public:
  ABI44_0_0RCTMessageThread(NSRunLoop *runLoop, ABI44_0_0RCTJavaScriptCompleteBlock errorBlock);
  ~ABI44_0_0RCTMessageThread() override;
  void runOnQueue(std::function<void()> &&) override;
  void runOnQueueSync(std::function<void()> &&) override;
  void quitSynchronous() override;
  void setRunLoop(NSRunLoop *runLoop);

 private:
  void tryFunc(const std::function<void()> &func);
  void runAsync(std::function<void()> func);
  void runSync(std::function<void()> func);

  CFRunLoopRef m_cfRunLoop;
  ABI44_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::atomic_bool m_shutdown;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
