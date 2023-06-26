/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <memory>

#import <Foundation/Foundation.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

namespace ABI49_0_0facebook {
namespace xplat {
namespace module {
class CxxModule;
}
}
}

/**
 * Subclass ABI49_0_0RCTCxxModule to use cross-platform CxxModule on iOS.
 *
 * Subclasses must implement the createModule method to lazily produce the module. When running under the Cxx bridge
 * modules will be accessed directly, under the Objective-C bridge method access is wrapped through ABI49_0_0RCTCxxMethod.
 */
@interface ABI49_0_0RCTCxxModule : NSObject <ABI49_0_0RCTBridgeModule>

// To be implemented by subclasses
- (std::unique_ptr<ABI49_0_0facebook::xplat::module::CxxModule>)createModule;

@end
