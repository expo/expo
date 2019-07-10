/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeDelegate.h>

namespace facebook {
namespace ReactABI34_0_0 {

class JSExecutorFactory;

}
}

// This is a separate class so non-C++ implementations don't need to
// take a C++ dependency.

@protocol ABI34_0_0RCTCxxBridgeDelegate <ABI34_0_0RCTBridgeDelegate>

/**
 * In the ABI34_0_0RCTCxxBridge, if this method is implemented, return a
 * ExecutorFactory instance which can be used to create the executor.
 * If not implemented, or returns an empty pointer, JSIExecutorFactory
 * will be used with a JSCRuntime.
 */
- (std::unique_ptr<facebook::ReactABI34_0_0::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI34_0_0RCTBridge *)bridge;

@end
