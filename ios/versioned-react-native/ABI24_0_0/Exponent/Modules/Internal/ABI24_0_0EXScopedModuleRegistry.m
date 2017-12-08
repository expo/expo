// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedModuleRegistry.h"

@implementation ABI24_0_0EXScopedModuleRegistry

ABI24_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI24_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI24_0_0RCTBridge (ABI24_0_0EXScopedModuleRegistry)

- (ABI24_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI24_0_0EXScopedModuleRegistry class]];
}

@end
