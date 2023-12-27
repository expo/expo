/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ABI44_0_0React/ABI44_0_0RCTDefines.h>
#import <ABI44_0_0React/ABI44_0_0RCTJavaScriptExecutor.h>
#import <ABI44_0_0cxxreact/ABI44_0_0JSExecutor.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class ABI44_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
 public:
  ABI44_0_0RCTObjcExecutorFactory(
      id<ABI44_0_0RCTJavaScriptExecutor> jse,
      ABI44_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  id<ABI44_0_0RCTJavaScriptExecutor> m_jse;
  ABI44_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
