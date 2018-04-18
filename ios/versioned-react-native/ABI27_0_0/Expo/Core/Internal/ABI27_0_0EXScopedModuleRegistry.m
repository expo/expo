// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXScopedModuleRegistry.h"

@implementation ABI27_0_0EXScopedModuleRegistry

ABI27_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI27_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI27_0_0RCTBridge (ABI27_0_0EXScopedModuleRegistry)

- (ABI27_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI27_0_0EXScopedModuleRegistry class]];
}

@end
