/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>
#import <ReactABI29_0_0/ABI29_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI29_0_0/ABI29_0_0JSExecutor.h>

namespace facebook {
namespace ReactABI29_0_0 {

class ABI29_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  ABI29_0_0RCTObjcExecutorFactory(id<ABI29_0_0RCTJavaScriptExecutor> jse, ABI29_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<ABI29_0_0RCTJavaScriptExecutor> m_jse;
  ABI29_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
