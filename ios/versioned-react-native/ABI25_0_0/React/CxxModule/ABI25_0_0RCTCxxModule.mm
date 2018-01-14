/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTCxxModule.h"

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTFollyConvert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTLog.h>
#import <cxxReactABI25_0_0/ABI25_0_0CxxModule.h>

#import "ABI25_0_0RCTCxxMethod.h"

using namespace facebook::ReactABI25_0_0;

@implementation ABI25_0_0RCTCxxModule
{
  std::unique_ptr<facebook::xplat::module::CxxModule> _module;
}

+ (NSString *)moduleName
{
  return @"";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)lazyInit
{
  if (!_module) {
    _module = [self createModule];

    if (_module) {
      ABI25_0_0RCTAssert([ABI25_0_0RCTBridgeModuleNameForClass([self class]) isEqualToString:@(_module->getName().c_str())],
                @"CxxModule class name %@ does not match runtime name %s",
                ABI25_0_0RCTBridgeModuleNameForClass([self class]), _module->getName().c_str());
    }
  }
}

- (std::unique_ptr<facebook::xplat::module::CxxModule>)createModule
{
  ABI25_0_0RCTAssert(NO, @"Subclass %@ must override createModule", [self class]);
  return nullptr;
}

- (NSArray<id<ABI25_0_0RCTBridgeMethod>> *)methodsToExport;
{
  [self lazyInit];
  if (!_module) {
    return nil;
  }

  NSMutableArray *moduleMethods = [NSMutableArray new];
  for (const auto &method : _module->getMethods()) {
    [moduleMethods addObject:[[ABI25_0_0RCTCxxMethod alloc] initWithCxxMethod:method]];
  }
  return moduleMethods;
}

- (NSDictionary<NSString *, id> *)constantsToExport;
{
  [self lazyInit];
  if (!_module) {
    return nil;
  }

  NSMutableDictionary *moduleConstants = [NSMutableDictionary new];
  for (const auto &c : _module->getConstants()) {
    moduleConstants[@(c.first.c_str())] = convertFollyDynamicToId(c.second);
  }
  return moduleConstants;
}

@end
