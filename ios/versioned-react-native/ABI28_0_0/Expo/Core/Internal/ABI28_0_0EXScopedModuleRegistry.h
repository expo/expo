// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>

#import "ABI28_0_0EXScopedBridgeModule.h"

/**
 *  Use this in place of ABI28_0_0RCT_EXPORT_MODULE() to auto-init an instance of your scoped module on ABI28_0_0RCTBridge instances.
 *  @param js_name same as ABI28_0_0RCT_EXPORT_MODULE(), the module name available in JS
 *  @param kernel_service_class if specified, your module will be passed an unversioned instance of this kernel service at runtime.
 *         e.g. MyKernelService -> an instance of ABI28_0_0EXMyKernelService
 */
#define ABI28_0_0EX_EXPORT_SCOPED_MODULE(js_name, kernel_service_class) \
ABI28_0_0RCT_EXTERN void ABI28_0_0EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { ABI28_0_0EXRegisterScopedModule(self, @#kernel_service_class, nil); }

/**
 *  Use this in place of ABI28_0_0EX_EXPORT_SCOPED_MODULE() if the module requires more than one kernel service.
 *  @param js_name same as ABI28_0_0RCT_EXPORT_MODULE(), the module name available in JS
 *  @param ... strings representing names of kernel services to be passed to th emodule at runtime.
 *         e.g. @"MyKernelService" -> an instance of ABI28_0_0EXMyKernelService
 */
#define ABI28_0_0EX_EXPORT_SCOPED_MULTISERVICE_MODULE(js_name, ...) \
ABI28_0_0RCT_EXTERN void ABI28_0_0EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { ABI28_0_0EXRegisterScopedModule(self, __VA_ARGS__, nil); }

/**
 *  Provides a namespace/bottleneck through which scoped modules
 *  can make themselves accessible to other modules.
 *
 *  e.g. ABI28_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI28_0_0EXCoolClass, coolClass)
 *  provides the getter `_bridge.scopedModules.coolClass`.
 */
#define ABI28_0_0EX_DECLARE_SCOPED_MODULE_GETTER(className, getter) \
@interface ABI28_0_0EXScopedModuleRegistry (className) \
@property (nonatomic, readonly) className *getter; \
@end\

/**
 *  Use in conjunction with ABI28_0_0EX_DECLARE_SCOPED_MODULE_GETTER, but in the corresponding implementation file.
 */
#define ABI28_0_0EX_DEFINE_SCOPED_MODULE_GETTER(className, getter) \
@implementation  ABI28_0_0EXScopedModuleRegistry (className) \
- (className *)getter { return [self.bridge moduleForClass:[className class]]; } \
@end\

@interface ABI28_0_0EXScopedModuleRegistry : NSObject <ABI28_0_0RCTBridgeModule>

@end

@interface ABI28_0_0RCTBridge (ABI28_0_0EXScopedModuleRegistry)

@property (nonatomic, readonly) ABI28_0_0EXScopedModuleRegistry *scopedModules;

@end
