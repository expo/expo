// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI33_0_0EXScopedModuleRegistry.h"

@implementation ABI33_0_0EXScopedModuleRegistry

ABI33_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI33_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI33_0_0RCTBridge (ABI33_0_0EXScopedModuleRegistry)

- (ABI33_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI33_0_0EXScopedModuleRegistry class]];
}

@end
