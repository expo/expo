// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

#import "EXScopedBridgeModule.h"

/**
 *  Use this in place of RCT_EXPORT_MODULE() to auto-init an instance of your scoped module on RCTBridge instances.
 *  @param js_name same as RCT_EXPORT_MODULE(), the module name available in JS
 *  @param kernel_service_class if specified, your module will be passed an unversioned instance of this kernel service at runtime.
 *         e.g. MyKernelService -> an instance of EXMyKernelService
 */
#define EX_EXPORT_SCOPED_MODULE(js_name, kernel_service_class) \
RCT_EXTERN void EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { EXRegisterScopedModule(self, @#kernel_service_class, nil); }

/**
 *  Use this in place of EX_EXPORT_SCOPED_MODULE() if the module requires more than one kernel service.
 *  @param js_name same as RCT_EXPORT_MODULE(), the module name available in JS
 *  @param ... strings representing names of kernel services to be passed to th emodule at runtime.
 *         e.g. @"MyKernelService" -> an instance of EXMyKernelService
 */
#define EX_EXPORT_SCOPED_MULTISERVICE_MODULE(js_name, ...) \
RCT_EXTERN void EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { EXRegisterScopedModule(self, __VA_ARGS__, nil); }

/**
 *  Provides a namespace/bottleneck through which scoped modules
 *  can make themselves accessible to other modules.
 *
 *  e.g. EX_DECLARE_SCOPED_MODULE_GETTER(EXCoolClass, coolClass)
 *  provides the getter `_bridge.scopedModules.coolClass`.
 */
#define EX_DECLARE_SCOPED_MODULE_GETTER(className, getter) \
@interface EXScopedModuleRegistry (className) \
@property (nonatomic, readonly) className *__nonnull getter; \
@end\

/**
 *  Use in conjunction with EX_DECLARE_SCOPED_MODULE_GETTER, but in the corresponding implementation file.
 */
#define EX_DEFINE_SCOPED_MODULE_GETTER(className, getter) \
@implementation  EXScopedModuleRegistry (className) \
- (className *)getter { return [self.bridge moduleForClass:[className class]]; } \
@end\

@interface EXScopedModuleRegistry : NSObject <RCTBridgeModule>

@end

@interface RCTBridge (EXScopedModuleRegistry)

@property (nonatomic, readonly) EXScopedModuleRegistry *scopedModules;

@end
