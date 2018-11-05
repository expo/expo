// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXScopedModuleRegistry.h"

@implementation ABI29_0_0EXScopedModuleRegistry

ABI29_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI29_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI29_0_0RCTBridge (ABI29_0_0EXScopedModuleRegistry)

- (ABI29_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI29_0_0EXScopedModuleRegistry class]];
}

@end
