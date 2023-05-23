#pragma once

#import <memory>
#import <string>

#import <Foundation/Foundation.h>

#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTMessageThread.h>
#import <cxxreact/MessageQueueThread.h>

namespace facebook {
namespace react {

class REAMessageThread : public RCTMessageThread {
 public:
  using RCTMessageThread::RCTMessageThread;
  virtual void quitSynchronous() override;
};

} // namespace react
} // namespace facebook
