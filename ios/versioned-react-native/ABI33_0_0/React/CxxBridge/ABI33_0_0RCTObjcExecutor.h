/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ReactABI33_0_0/ABI33_0_0RCTDefines.h>
#import <ReactABI33_0_0/ABI33_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI33_0_0/ABI33_0_0JSExecutor.h>

namespace facebook {
namespace ReactABI33_0_0 {

class ABI33_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  ABI33_0_0RCTObjcExecutorFactory(id<ABI33_0_0RCTJavaScriptExecutor> jse, ABI33_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<ABI33_0_0RCTJavaScriptExecutor> m_jse;
  ABI33_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
