/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#import <ABI39_0_0React/ABI39_0_0RCTBridgeDelegate.h>

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

class JSExecutorFactory;

}
}

// This is a separate class so non-C++ implementations don't need to
// take a C++ dependency.

@protocol ABI39_0_0RCTCxxBridgeDelegate <ABI39_0_0RCTBridgeDelegate>

/**
 * In the ABI39_0_0RCTCxxBridge, if this method is implemented, return a
 * ExecutorFactory instance which can be used to create the executor.
 * If not implemented, or returns an empty pointer, JSIExecutorFactory
 * will be used with a JSCRuntime.
 */
- (void *)jsExecutorFactoryForBridge:(ABI39_0_0RCTBridge *)bridge;

@end
