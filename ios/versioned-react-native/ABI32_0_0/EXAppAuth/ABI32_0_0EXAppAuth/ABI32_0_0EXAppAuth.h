// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

static id ABI32_0_0EXnullIfEmpty(NSString *input) {
  if (!input || input == nil || [input isEqualToString:@""]) {
    return [NSNull null];
  }
  return input;
}

@interface ABI32_0_0EXAppAuth : ABI32_0_0EXExportedModule <ABI32_0_0EXModuleRegistryConsumer>

@end
