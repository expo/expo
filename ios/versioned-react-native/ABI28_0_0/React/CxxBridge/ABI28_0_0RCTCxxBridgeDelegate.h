/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#import <ReactABI28_0_0/ABI28_0_0RCTBridgeDelegate.h>
#import <ABI28_0_0jschelpers/ABI28_0_0JavaScriptCore.h>

namespace facebook {
namespace ReactABI28_0_0 {

class JSExecutorFactory;

}
}

// This is a separate class so non-C++ implementations don't need to
// take a C++ dependency.

@protocol ABI28_0_0RCTCxxBridgeDelegate <ABI28_0_0RCTBridgeDelegate>

/**
 * In the ABI28_0_0RCTCxxBridge, if this method is implemented, return a
 * ExecutorFactory instance which can be used to create the executor.
 * If not implemented, or returns an empty pointer, JSCExecutorFactory
 * will be used.
 */
- (std::unique_ptr<facebook::ReactABI28_0_0::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI28_0_0RCTBridge *)bridge;

@optional

/**
 * Experimental: Perform installation of extra JS binding on the given JS context, as appropriate.
 */
- (void)installExtraJSBinding:(JSGlobalContextRef)jsContextRef;

/**
 * Experimental: Get the instance of the extra module/class which gets bound via `installExtraJSBinding:`
 */
- (id)jsBoundExtraModuleForClass:(Class)moduleClass;

@end
