/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ReactABI34_0_0/ABI34_0_0RCTDefines.h>
#import <ReactABI34_0_0/ABI34_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI34_0_0/ABI34_0_0JSExecutor.h>

namespace facebook {
namespace ReactABI34_0_0 {

class ABI34_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  ABI34_0_0RCTObjcExecutorFactory(id<ABI34_0_0RCTJavaScriptExecutor> jse, ABI34_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<ABI34_0_0RCTJavaScriptExecutor> m_jse;
  ABI34_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
