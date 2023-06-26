#pragma once

#import <memory>
#import <string>

#import <Foundation/Foundation.h>

#import <ABI49_0_0React/ABI49_0_0RCTJavaScriptExecutor.h>
#import <ABI49_0_0React/ABI49_0_0RCTMessageThread.h>
#import <ABI49_0_0cxxreact/ABI49_0_0MessageQueueThread.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class ABI49_0_0REAMessageThread : public ABI49_0_0RCTMessageThread {
 public:
  using ABI49_0_0RCTMessageThread::ABI49_0_0RCTMessageThread;
  virtual void quitSynchronous() override;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
