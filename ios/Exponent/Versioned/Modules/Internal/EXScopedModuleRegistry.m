// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedModuleRegistry.h"

@implementation EXScopedModuleRegistry

RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation RCTBridge (EXScopedModuleRegistry)

- (EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[EXScopedModuleRegistry class]];
}

@end
