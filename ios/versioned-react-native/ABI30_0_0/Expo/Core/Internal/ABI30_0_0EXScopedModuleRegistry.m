// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXScopedModuleRegistry.h"

@implementation ABI30_0_0EXScopedModuleRegistry

ABI30_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI30_0_0RCTBridge (ABI30_0_0EXScopedModuleRegistry)

- (ABI30_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI30_0_0EXScopedModuleRegistry class]];
}

@end
