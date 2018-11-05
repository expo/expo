/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <memory>

#import <ReactABI26_0_0/ABI26_0_0RCTBridgeDelegate.h>

namespace facebook {
namespace ReactABI26_0_0 {

class JSExecutorFactory;

}
}

// This is a separate class so non-C++ implementations don't need to
// take a C++ dependency.

@protocol ABI26_0_0RCTCxxBridgeDelegate <ABI26_0_0RCTBridgeDelegate>

/**
 * In the ABI26_0_0RCTCxxBridge, if this method is implemented, return a
 * ExecutorFactory instance which can be used to create the executor.
 * If not implemented, or returns an empty pointer, JSCExecutorFactory
 * will be used.
 */
- (std::unique_ptr<facebook::ReactABI26_0_0::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI26_0_0RCTBridge *)bridge;

@end
