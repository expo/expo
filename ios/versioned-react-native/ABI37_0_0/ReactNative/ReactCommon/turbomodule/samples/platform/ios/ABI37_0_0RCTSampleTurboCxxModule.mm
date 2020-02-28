/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTSampleTurboCxxModule.h"

#import <ABI37_0_0ReactCommon/ABI37_0_0SampleTurboCxxModule.h>
#import <ABI37_0_0cxxreact/ABI37_0_0CxxModule.h>
#import "ABI37_0_0SampleTurboCxxModuleLegacyImpl.h"

using namespace ABI37_0_0facebook;

// ObjC++ wrapper.
@implementation ABI37_0_0RCTSampleTurboCxxModule_v1

ABI37_0_0RCT_EXPORT_MODULE();

- (std::shared_ptr<ABI37_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI37_0_0React::JSCallInvoker>)jsInvoker
{
  return std::make_shared<ABI37_0_0React::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

@end

@implementation ABI37_0_0RCTSampleTurboCxxModule_v2

ABI37_0_0RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<ABI37_0_0React::SampleTurboCxxModuleLegacyImpl>();
}

@end
