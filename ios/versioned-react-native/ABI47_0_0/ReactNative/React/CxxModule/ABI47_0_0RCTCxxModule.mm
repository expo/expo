/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTCxxModule.h"

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTFollyConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import <ABI47_0_0cxxreact/ABI47_0_0CxxModule.h>

#import "ABI47_0_0RCTCxxMethod.h"

using namespace ABI47_0_0facebook::ABI47_0_0React;

@implementation ABI47_0_0RCTCxxModule {
  std::unique_ptr<ABI47_0_0facebook::xplat::module::CxxModule> _module;
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
      ABI47_0_0RCTAssert(
          [ABI47_0_0RCTBridgeModuleNameForClass([self class]) isEqualToString:@(_module->getName().c_str())],
          @"CxxModule class name %@ does not match runtime name %s",
          ABI47_0_0RCTBridgeModuleNameForClass([self class]),
          _module->getName().c_str());
    }
  }
}

- (std::unique_ptr<ABI47_0_0facebook::xplat::module::CxxModule>)createModule
{
  ABI47_0_0RCTAssert(NO, @"Subclass %@ must override createModule", [self class]);
  return nullptr;
}

- (NSArray<id<ABI47_0_0RCTBridgeMethod>> *)methodsToExport
{
  [self lazyInit];
  if (!_module) {
    return nil;
  }

  NSMutableArray *moduleMethods = [NSMutableArray new];
  for (const auto &method : _module->getMethods()) {
    [moduleMethods addObject:[[ABI47_0_0RCTCxxMethod alloc] initWithCxxMethod:method]];
  }
  return moduleMethods;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
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
