// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI46_0_0EXScopedModuleRegistry.h"
#import "ABI46_0_0EXUnversioned.h"

static NSMutableDictionary<NSString *, NSDictionary *> *ABI46_0_0EXScopedModuleClasses;

NSDictionary<NSString *, NSDictionary *> * ABI46_0_0EXGetScopedModuleClasses(void);
NSDictionary<NSString *, NSDictionary *> * ABI46_0_0EXGetScopedModuleClasses()
{
  return ABI46_0_0EXScopedModuleClasses;
}

void ABI46_0_0EXRegisterScopedModule(Class, ...);
void ABI46_0_0EXRegisterScopedModule(Class moduleClass, ...)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI46_0_0EXScopedModuleClasses = [NSMutableDictionary dictionary];
  });

  NSString *kernelServiceClassName;
  va_list argumentList;
  NSMutableDictionary *unversionedKernelServiceClassNames = [[NSMutableDictionary alloc] init];

  va_start(argumentList, moduleClass);
  while ((kernelServiceClassName = va_arg(argumentList, NSString*))) {
    if ([kernelServiceClassName isEqualToString:@"nil"]) {
      unversionedKernelServiceClassNames[kernelServiceClassName] = ABI46_0_0EX_KERNEL_SERVICE_NONE;
    } else {
      unversionedKernelServiceClassNames[kernelServiceClassName] = [@"EX" stringByAppendingString:kernelServiceClassName];
    }
  }
  va_end(argumentList);

  NSString *moduleClassName = NSStringFromClass(moduleClass);
  if (moduleClassName) {
    ABI46_0_0EXScopedModuleClasses[moduleClassName] = unversionedKernelServiceClassNames;
  }
}

@implementation ABI46_0_0EXScopedModuleRegistry

ABI46_0_0RCT_EXPORT_MODULE(ExponentScopedModuleRegistry);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

@implementation ABI46_0_0RCTBridge (ABI46_0_0EXScopedModuleRegistry)

- (ABI46_0_0EXScopedModuleRegistry *)scopedModules
{
  return [self moduleForClass:[ABI46_0_0EXScopedModuleRegistry class]];
}

@end
