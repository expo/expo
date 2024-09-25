// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedModuleRegistry.h"
#import "EXUnversioned.h"

static NSMutableDictionary<NSString *, NSDictionary *> *EXScopedModuleClasses;

NSDictionary<NSString *, NSDictionary *> * EXGetScopedModuleClasses(void);
NSDictionary<NSString *, NSDictionary *> * EXGetScopedModuleClasses(void)
{
  return EXScopedModuleClasses;
}

void EXRegisterScopedModule(Class, ...);
void EXRegisterScopedModule(Class moduleClass, ...)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    EXScopedModuleClasses = [NSMutableDictionary dictionary];
  });

  NSString *kernelServiceClassName;
  va_list argumentList;
  NSMutableDictionary *unversionedKernelServiceClassNames = [[NSMutableDictionary alloc] init];

  va_start(argumentList, moduleClass);
  while ((kernelServiceClassName = va_arg(argumentList, NSString*))) {
    if ([kernelServiceClassName isEqualToString:@"nil"]) {
      unversionedKernelServiceClassNames[kernelServiceClassName] = EX_KERNEL_SERVICE_NONE;
    } else {
      unversionedKernelServiceClassNames[kernelServiceClassName] = [EX_UNVERSIONED(@"EX") stringByAppendingString:kernelServiceClassName];
    }
  }
  va_end(argumentList);

  NSString *moduleClassName = NSStringFromClass(moduleClass);
  if (moduleClassName) {
    EXScopedModuleClasses[moduleClassName] = unversionedKernelServiceClassNames;
  }
}

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
