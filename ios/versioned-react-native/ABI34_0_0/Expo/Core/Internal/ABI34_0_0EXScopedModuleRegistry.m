// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI34_0_0EXScopedModuleRegistry.h"

@implementation ABI34_0_0EXScopedModuleRegistry

ABI34_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI34_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI34_0_0RCTBridge (ABI34_0_0EXScopedModuleRegistry)

- (ABI34_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI34_0_0EXScopedModuleRegistry class]];
}

@end
