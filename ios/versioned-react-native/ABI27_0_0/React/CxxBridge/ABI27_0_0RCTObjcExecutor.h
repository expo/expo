/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ReactABI27_0_0/ABI27_0_0RCTDefines.h>
#import <ReactABI27_0_0/ABI27_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI27_0_0/ABI27_0_0JSExecutor.h>

namespace facebook {
namespace ReactABI27_0_0 {

class ABI27_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  ABI27_0_0RCTObjcExecutorFactory(id<ABI27_0_0RCTJavaScriptExecutor> jse, ABI27_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<ABI27_0_0RCTJavaScriptExecutor> m_jse;
  ABI27_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
