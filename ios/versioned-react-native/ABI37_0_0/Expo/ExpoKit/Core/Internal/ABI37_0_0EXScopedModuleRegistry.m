// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI37_0_0EXScopedModuleRegistry.h"

@implementation ABI37_0_0EXScopedModuleRegistry

ABI37_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI37_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI37_0_0RCTBridge (ABI37_0_0EXScopedModuleRegistry)

- (ABI37_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI37_0_0EXScopedModuleRegistry class]];
}

@end
