/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTSampleTurboCxxModule.h"

#import <ABI36_0_0ReactCommon/ABI36_0_0SampleTurboCxxModule.h>
#import <ABI36_0_0cxxreact/ABI36_0_0CxxModule.h>
#import "ABI36_0_0SampleTurboCxxModuleLegacyImpl.h"

using namespace ABI36_0_0facebook;

// ObjC++ wrapper.
@implementation ABI36_0_0RCTSampleTurboCxxModule_v1

ABI36_0_0RCT_EXPORT_MODULE();

- (std::shared_ptr<ABI36_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI36_0_0React::JSCallInvoker>)jsInvoker
{
  return std::make_shared<ABI36_0_0React::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

@end

@implementation ABI36_0_0RCTSampleTurboCxxModule_v2

ABI36_0_0RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<ABI36_0_0React::SampleTurboCxxModuleLegacyImpl>();
}

@end
