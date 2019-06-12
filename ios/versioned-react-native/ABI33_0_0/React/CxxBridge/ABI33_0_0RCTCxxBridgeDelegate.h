/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeDelegate.h>

namespace facebook {
namespace ReactABI33_0_0 {

class JSExecutorFactory;

}
}

// This is a separate class so non-C++ implementations don't need to
// take a C++ dependency.

@protocol ABI33_0_0RCTCxxBridgeDelegate <ABI33_0_0RCTBridgeDelegate>

/**
 * In the ABI33_0_0RCTCxxBridge, if this method is implemented, return a
 * ExecutorFactory instance which can be used to create the executor.
 * If not implemented, or returns an empty pointer, ABI33_0_0JSIExecutorFactory
 * will be used with a ABI33_0_0JSCRuntime.
 */
- (std::unique_ptr<facebook::ReactABI33_0_0::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI33_0_0RCTBridge *)bridge;

@end
