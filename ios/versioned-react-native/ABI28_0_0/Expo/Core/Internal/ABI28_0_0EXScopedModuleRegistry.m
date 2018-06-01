// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXScopedModuleRegistry.h"

@implementation ABI28_0_0EXScopedModuleRegistry

ABI28_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI28_0_0RCTBridge (ABI28_0_0EXScopedModuleRegistry)

- (ABI28_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI28_0_0EXScopedModuleRegistry class]];
}

@end
