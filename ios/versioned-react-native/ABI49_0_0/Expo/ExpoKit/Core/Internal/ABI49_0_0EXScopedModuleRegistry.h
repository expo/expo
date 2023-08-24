// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

#import "ABI49_0_0EXScopedBridgeModule.h"

// used for initializing scoped modules which don't tie in to any kernel service.
#define ABI49_0_0EX_KERNEL_SERVICE_NONE @"ABI49_0_0EXKernelServiceNone"

/**
 *  Use this in place of ABI49_0_0RCT_EXPORT_MODULE() to auto-init an instance of your scoped module on ABI49_0_0RCTBridge instances.
 *  @param js_name same as ABI49_0_0RCT_EXPORT_MODULE(), the module name available in JS
 *  @param kernel_service_class if specified, your module will be passed an unversioned instance of this kernel service at runtime.
 *         e.g. MyKernelService -> an instance of ABI49_0_0EXMyKernelService
 */
#define ABI49_0_0EX_EXPORT_SCOPED_MODULE(js_name, kernel_service_class) \
ABI49_0_0RCT_EXTERN void ABI49_0_0EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { ABI49_0_0EXRegisterScopedModule(self, @#kernel_service_class, nil); }

/**
 *  Use this in place of ABI49_0_0EX_EXPORT_SCOPED_MODULE() if the module requires more than one kernel service.
 *  @param js_name same as ABI49_0_0RCT_EXPORT_MODULE(), the module name available in JS
 *  @param ... strings representing names of kernel services to be passed to th emodule at runtime.
 *         e.g. @"MyKernelService" -> an instance of ABI49_0_0EXMyKernelService
 */
#define ABI49_0_0EX_EXPORT_SCOPED_MULTISERVICE_MODULE(js_name, ...) \
ABI49_0_0RCT_EXTERN void ABI49_0_0EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { ABI49_0_0EXRegisterScopedModule(self, __VA_ARGS__, nil); }

/**
 *  Provides a namespace/bottleneck through which scoped modules
 *  can make themselves accessible to other modules.
 *
 *  e.g. ABI49_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI49_0_0EXCoolClass, coolClass)
 *  provides the getter `_bridge.scopedModules.coolClass`.
 */
#define ABI49_0_0EX_DECLARE_SCOPED_MODULE_GETTER(className, getter) \
@interface ABI49_0_0EXScopedModuleRegistry (className) \
@property (nonatomic, readonly) className *__nonnull getter; \
@end\

/**
 *  Use in conjunction with ABI49_0_0EX_DECLARE_SCOPED_MODULE_GETTER, but in the corresponding implementation file.
 */
#define ABI49_0_0EX_DEFINE_SCOPED_MODULE_GETTER(className, getter) \
@implementation  ABI49_0_0EXScopedModuleRegistry (className) \
- (className *)getter { return [self.bridge moduleForClass:[className class]]; } \
@end\

@interface ABI49_0_0EXScopedModuleRegistry : NSObject <ABI49_0_0RCTBridgeModule>

@end

@class ABI49_0_0RCTBridge;

@interface ABI49_0_0RCTBridge (ABI49_0_0EXScopedModuleRegistry)

@property (nonatomic, readonly) ABI49_0_0EXScopedModuleRegistry *scopedModules;

@end
