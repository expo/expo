/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSampleTurboCxxModule.h"

#import <ABI38_0_0ReactCommon/ABI38_0_0SampleTurboCxxModule.h>
#import <ABI38_0_0cxxreact/ABI38_0_0CxxModule.h>
#import "ABI38_0_0SampleTurboCxxModuleLegacyImpl.h"

using namespace ABI38_0_0facebook;

// ObjC++ wrapper.
@implementation ABI38_0_0RCTSampleTurboCxxModule_v1

ABI38_0_0RCT_EXPORT_MODULE();

- (std::shared_ptr<ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0React::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

@end

@implementation ABI38_0_0RCTSampleTurboCxxModule_v2

ABI38_0_0RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<ABI38_0_0React::SampleTurboCxxModuleLegacyImpl>();
}

@end
