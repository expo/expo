/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTSampleTurboCxxModule.h"

#import <ABI39_0_0ReactCommon/ABI39_0_0SampleTurboCxxModule.h>
#import <ABI39_0_0cxxreact/ABI39_0_0CxxModule.h>
#import "ABI39_0_0SampleTurboCxxModuleLegacyImpl.h"

using namespace ABI39_0_0facebook;

// ObjC++ wrapper.
@implementation ABI39_0_0RCTSampleTurboCxxModule_v1

ABI39_0_0RCT_EXPORT_MODULE();

- (std::shared_ptr<ABI39_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI39_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI39_0_0React::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

@end

@implementation ABI39_0_0RCTSampleTurboCxxModule_v2

ABI39_0_0RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<ABI39_0_0React::SampleTurboCxxModuleLegacyImpl>();
}

@end
