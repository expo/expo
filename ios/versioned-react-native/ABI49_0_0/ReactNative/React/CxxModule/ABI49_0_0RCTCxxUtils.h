/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>
#include <memory>

#import <Foundation/Foundation.h>

@class ABI49_0_0RCTBridge;
@class ABI49_0_0RCTModuleData;

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class Instance;
class NativeModule;

std::vector<std::unique_ptr<NativeModule>>
createNativeModules(NSArray<ABI49_0_0RCTModuleData *> *modules, ABI49_0_0RCTBridge *bridge, const std::shared_ptr<Instance> &instance);

NSError *tryAndReturnError(const std::function<void()> &func);
NSString *deriveSourceURL(NSURL *url);

}
}
