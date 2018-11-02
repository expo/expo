// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXAppAuth : EXExportedModule <EXModuleRegistryConsumer>

+ (_Nonnull instancetype)instance;

#if !TARGET_OS_TV
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options;
#endif

@end
