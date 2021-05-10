/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ABI39_0_0React/ABI39_0_0RCTDefines.h>
#import <ABI39_0_0React/ABI39_0_0RCTJavaScriptExecutor.h>
#import <ABI39_0_0cxxreact/ABI39_0_0JSExecutor.h>

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

class ABI39_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
 public:
  ABI39_0_0RCTObjcExecutorFactory(
      id<ABI39_0_0RCTJavaScriptExecutor> jse,
      ABI39_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  id<ABI39_0_0RCTJavaScriptExecutor> m_jse;
  ABI39_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook
