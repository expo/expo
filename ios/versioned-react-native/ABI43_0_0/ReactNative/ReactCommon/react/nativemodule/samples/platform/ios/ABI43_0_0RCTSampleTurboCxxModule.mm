/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTSampleTurboCxxModule.h"

#import <ABI43_0_0ReactCommon/ABI43_0_0SampleTurboCxxModule.h>
#import <ABI43_0_0cxxreact/ABI43_0_0CxxModule.h>
#import "ABI43_0_0SampleTurboCxxModuleLegacyImpl.h"

using namespace ABI43_0_0facebook;

// ObjC++ wrapper.
@implementation ABI43_0_0RCTSampleTurboCxxModule_v1

ABI43_0_0RCT_EXPORT_MODULE();

- (std::shared_ptr<ABI43_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI43_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI43_0_0React::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

@end

@implementation ABI43_0_0RCTSampleTurboCxxModule_v2

ABI43_0_0RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<ABI43_0_0React::SampleTurboCxxModuleLegacyImpl>();
}

@end
