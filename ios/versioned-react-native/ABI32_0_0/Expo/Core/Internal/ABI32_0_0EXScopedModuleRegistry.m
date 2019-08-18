// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXScopedModuleRegistry.h"

@implementation ABI32_0_0EXScopedModuleRegistry

ABI32_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI32_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI32_0_0RCTBridge (ABI32_0_0EXScopedModuleRegistry)

- (ABI32_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI32_0_0EXScopedModuleRegistry class]];
}

@end
