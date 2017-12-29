// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedModuleRegistry.h"

@implementation ABI21_0_0EXScopedModuleRegistry

ABI21_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI21_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI21_0_0RCTBridge (ABI21_0_0EXScopedModuleRegistry)

- (ABI21_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI21_0_0EXScopedModuleRegistry class]];
}

@end
