/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>
#import <ABI49_0_0React/ABI49_0_0RCTJavaScriptExecutor.h>
#import <ABI49_0_0cxxreact/ABI49_0_0JSExecutor.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class ABI49_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
 public:
  ABI49_0_0RCTObjcExecutorFactory(
      id<ABI49_0_0RCTJavaScriptExecutor> jse,
      ABI49_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  id<ABI49_0_0RCTJavaScriptExecutor> m_jse;
  ABI49_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
