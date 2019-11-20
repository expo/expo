/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeDelegate.h>

namespace ABI35_0_0facebook {
namespace ReactABI35_0_0 {

class JSExecutorFactory;

}
}

// This is a separate class so non-C++ implementations don't need to
// take a C++ dependency.

@protocol ABI35_0_0RCTCxxBridgeDelegate <ABI35_0_0RCTBridgeDelegate>

/**
 * In the ABI35_0_0RCTCxxBridge, if this method is implemented, return a
 * ExecutorFactory instance which can be used to create the executor.
 * If not implemented, or returns an empty pointer, JSIExecutorFactory
 * will be used with a JSCRuntime.
 */
- (std::unique_ptr<ABI35_0_0facebook::ReactABI35_0_0::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI35_0_0RCTBridge *)bridge;

@end
