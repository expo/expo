/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ReactABI35_0_0/ABI35_0_0RCTDefines.h>
#import <ReactABI35_0_0/ABI35_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI35_0_0/ABI35_0_0JSExecutor.h>

namespace ABI35_0_0facebook {
namespace ReactABI35_0_0 {

class ABI35_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  ABI35_0_0RCTObjcExecutorFactory(id<ABI35_0_0RCTJavaScriptExecutor> jse, ABI35_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<ABI35_0_0RCTJavaScriptExecutor> m_jse;
  ABI35_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
