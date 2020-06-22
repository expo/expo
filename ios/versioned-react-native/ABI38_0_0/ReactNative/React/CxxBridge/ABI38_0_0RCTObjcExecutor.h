/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <ABI38_0_0React/ABI38_0_0RCTDefines.h>
#import <ABI38_0_0React/ABI38_0_0RCTJavaScriptExecutor.h>
#import <ABI38_0_0cxxreact/ABI38_0_0JSExecutor.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

class ABI38_0_0RCTObjcExecutorFactory : public JSExecutorFactory {
public:
  ABI38_0_0RCTObjcExecutorFactory(id<ABI38_0_0RCTJavaScriptExecutor> jse, ABI38_0_0RCTJavaScriptCompleteBlock errorBlock);
  std::unique_ptr<JSExecutor> createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  id<ABI38_0_0RCTJavaScriptExecutor> m_jse;
  ABI38_0_0RCTJavaScriptCompleteBlock m_errorBlock;
};

}
}
