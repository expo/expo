// Copyright © 2018 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXNativeModulesProxy+Modules.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXViewManager.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXModule.h>
#import <objc/runtime.h>

#define QUOTE(str) #str
#define EXPAND_AND_QUOTE(str) QUOTE(str)

#define EX_IS_METHOD_EXPORTED(methodName) \
  [methodName hasPrefix:@EXPAND_AND_QUOTE(EX_EXPORTED_METHODS_PREFIX)]

@implementation EXNativeModulesProxy (Modules)

- (BOOL)isModuleExportable:(id<EXModule>)module
{
  if (![module conformsToProtocol:@protocol(EXExportedModule)]) {
    return false;
  }
  
  if ([[module class] moduleName] == nil || [[[module class] moduleName] length] == 0) {
    // Although module defines a name, it is nil or empty, so constants cannot be exported.
    return false;
  }
  
  return true;
}

- (NSDictionary <NSString *, id> *)getExportedConstantsOfModule:(id<EXModule>)module
{
  if (![module conformsToProtocol:@protocol(EXExportedModule)] || ![module respondsToSelector:@selector(constantsToExport)]) {
    // Module does not implement constantsToExport, so it has no constants to export.
    return nil;
  }
  
  id<EXExportedModule> exportedModule = (id<EXExportedModule>) module;

  return [exportedModule constantsToExport];
}

- (NSArray<NSDictionary *> *)getExportedMethodsOfModule:(id<EXModule>)module
{
  NSMutableArray<NSDictionary *> *exportedMethods = [NSMutableArray array];

  unsigned int methodsCount;
  Method *methodsDescriptions = class_copyMethodList(object_getClass([module class]), &methodsCount);

  @try {
    for(int i = 0; i < methodsCount; i++) {
      Method method = methodsDescriptions[i];
      SEL methodSelector = method_getName(method);
      NSString *methodName = NSStringFromSelector(methodSelector);
      if (EX_IS_METHOD_EXPORTED(methodName)) {
        IMP imp = method_getImplementation(method);
        const EXMethodInfo *info = ((const EXMethodInfo *(*)(id, SEL))imp)([module class], methodSelector);
        [exportedMethods addObject:@{
                                     EXJsMethodNameKeyPath: [NSString stringWithUTF8String:info->jsName],
                                     EXObjcMethodNameKeyPath: [NSString stringWithUTF8String:info->objcName]
                                     }];
      }
    }
  }
  @finally {
    free(methodsDescriptions);
  }

  return exportedMethods;
}

- (NSArray<NSString *> *)getSupportedEventsOfModule:(id<EXModule>)module
{
  if (![module conformsToProtocol:@protocol(EXEventEmitter)]) {
    return nil;
  }

  id<EXEventEmitter> eventEmitter = (id<EXEventEmitter>) module;

  return [eventEmitter supportedEvents];
}

RCT_EXPORT_METHOD(callMethod:(NSString *)moduleName methodName:(NSString *)methodName arguments:(NSArray *)arguments resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  id module = [self.moduleRegistry getExportedModuleForName:moduleName];
  if (module == nil) {
    NSString *reason = [NSString stringWithFormat:@"No exported module was found for name '%@'. Are you sure all the packages are linked correctly?", moduleName];
    reject(@"E_NO_MODULE", reason, nil);
    return;
  }
  
  NSString *methodDeclaration = self.exportedMethods[moduleName][methodName];
  if (methodDeclaration == nil) {
    NSString *reason = [NSString stringWithFormat:@"Module '%@' does not export method '%@'.", moduleName, methodName];
    reject(@"E_NO_METHOD", reason, nil);
    return;
  }
  SEL selector = NSSelectorFromString(methodDeclaration);
  NSMethodSignature *methodSignature = [module methodSignatureForSelector:selector];
  if (methodSignature == nil) {
    // This in fact should never happen -- if we have a methodDeclaration for an exported method
    // it means that it has been exported with EX_EXPORT_METHOD and if we cannot find method signature
    // for the cached selector either the macro or the -selectorNameFromName is faulty.
    NSString *reason = [NSString stringWithFormat:@"Module '%@' does not implement method for selector '%@'.", moduleName, NSStringFromSelector(selector)];
    reject(@"E_NO_METHOD", reason, nil);
    return;
  }
  
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
  [invocation setTarget:module];
  [invocation setSelector:selector];
  [arguments enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    if (obj != [NSNull null]) {
      [invocation setArgument:&obj atIndex:(2 + idx)];
    }
  }];
  [invocation setArgument:&resolve atIndex:(2 + [arguments count])];
  [invocation setArgument:&reject atIndex:([arguments count] + 2 + 1)];
  [invocation retainArguments];

  if ([module respondsToSelector:@selector(methodQueue)]) {
    dispatch_async([module methodQueue], ^{
      [invocation invoke];
    });
  } else {
    [invocation invoke];
  }
}

@end
