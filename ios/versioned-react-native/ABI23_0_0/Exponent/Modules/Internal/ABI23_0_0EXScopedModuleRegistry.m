// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedModuleRegistry.h"

@implementation ABI23_0_0EXScopedModuleRegistry

ABI23_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI23_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI23_0_0RCTBridge (ABI23_0_0EXScopedModuleRegistry)

- (ABI23_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI23_0_0EXScopedModuleRegistry class]];
}

@end
