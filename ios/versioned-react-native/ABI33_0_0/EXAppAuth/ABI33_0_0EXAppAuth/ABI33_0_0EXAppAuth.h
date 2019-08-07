// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

static id ABI33_0_0EXnullIfEmpty(NSString *input) {
  if (!input || input == nil || [input isEqualToString:@""]) {
    return [NSNull null];
  }
  return input;
}

@interface ABI33_0_0EXAppAuth : ABI33_0_0UMExportedModule <ABI33_0_0UMModuleRegistryConsumer>

@end
