// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

static id EXnullIfEmpty(NSString *input) {
  if (!input || input == nil || [input isEqualToString:@""]) {
    return [NSNull null];
  }
  return input;
}

@interface EXAppAuth : UMExportedModule <UMModuleRegistryConsumer>

+ (_Nonnull instancetype)instance;

#if !TARGET_OS_TV
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options;
#endif



@end
