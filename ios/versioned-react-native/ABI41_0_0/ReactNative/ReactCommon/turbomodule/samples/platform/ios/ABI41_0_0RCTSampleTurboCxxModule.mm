/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSampleTurboCxxModule.h"

#import <ABI41_0_0ReactCommon/ABI41_0_0SampleTurboCxxModule.h>
#import <ABI41_0_0cxxreact/ABI41_0_0CxxModule.h>
#import "ABI41_0_0SampleTurboCxxModuleLegacyImpl.h"

using namespace ABI41_0_0facebook;

// ObjC++ wrapper.
@implementation ABI41_0_0RCTSampleTurboCxxModule_v1

ABI41_0_0RCT_EXPORT_MODULE();

- (std::shared_ptr<ABI41_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI41_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI41_0_0React::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

@end

@implementation ABI41_0_0RCTSampleTurboCxxModule_v2

ABI41_0_0RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<ABI41_0_0React::SampleTurboCxxModuleLegacyImpl>();
}

@end
