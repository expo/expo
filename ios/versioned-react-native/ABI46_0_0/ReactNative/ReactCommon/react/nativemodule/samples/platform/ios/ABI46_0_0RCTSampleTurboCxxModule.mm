/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTSampleTurboCxxModule.h"

#import <ABI46_0_0ReactCommon/ABI46_0_0SampleTurboCxxModule.h>
#import <ABI46_0_0cxxreact/ABI46_0_0CxxModule.h>
#import "ABI46_0_0SampleTurboCxxModuleLegacyImpl.h"

using namespace ABI46_0_0facebook;

// ObjC++ wrapper.
@implementation ABI46_0_0RCTSampleTurboCxxModule_v1

ABI46_0_0RCT_EXPORT_MODULE();

- (std::shared_ptr<ABI46_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI46_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI46_0_0React::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

- (std::shared_ptr<ABI46_0_0facebook::ABI46_0_0React::TurboModule>)getTurboModule:
    (const ABI46_0_0facebook::ABI46_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

@implementation ABI46_0_0RCTSampleTurboCxxModule_v2

ABI46_0_0RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<ABI46_0_0React::SampleTurboCxxModuleLegacyImpl>();
}

- (std::shared_ptr<ABI46_0_0facebook::ABI46_0_0React::TurboModule>)getTurboModule:
    (const ABI46_0_0facebook::ABI46_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end
