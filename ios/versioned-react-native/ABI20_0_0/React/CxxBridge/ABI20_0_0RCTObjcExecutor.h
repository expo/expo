/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <functional>
#include <memory>

#import <ReactABI20_0_0/ABI20_0_0RCTDefines.h>
#import <ReactABI20_0_0/ABI20_0_0RCTJavaScriptExecutor.h>
#import <cxxReactABI20_0_0/ABI20_0_0JSExecutor.h>

namespace facebook {
namespace ReactABI20_0_0 {

class ABI20_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  ABI20_0_0RCTObjcExecutorFactory(id<ABI20_0_0RCTJavaScriptExecutor> jse, ABI20_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<ABI20_0_0RCTJavaScriptExecutor> m_jse;
  ABI20_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
