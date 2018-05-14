// Copyright © 2018 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXNativeModulesProxy.h>
#import <EXReactNativeAdapter/EXViewManagerAdapter.h>

static const NSString *EXJsMethodNameKeyPath = @"jsName";
static const NSString *EXObjcMethodNameKeyPath = @"objcName";

@interface EXNativeModulesProxy (Modules)

- (BOOL)isModuleExportable:(id<EXModule>)module;
- (NSArray<NSString *> *)getSupportedEventsOfModule:(id<EXModule>)module;
- (NSArray<NSDictionary *> *)getExportedMethodsOfModule:(id<EXModule>)module;
- (NSDictionary<NSString *, id> *)getExportedConstantsOfModule:(id<EXModule>)module;

@end
