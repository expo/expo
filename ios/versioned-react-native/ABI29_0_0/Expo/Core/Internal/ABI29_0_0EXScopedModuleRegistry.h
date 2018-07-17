// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>

#import "ABI29_0_0EXScopedBridgeModule.h"

/**
 *  Use this in place of ABI29_0_0RCT_EXPORT_MODULE() to auto-init an instance of your scoped module on ABI29_0_0RCTBridge instances.
 *  @param js_name same as ABI29_0_0RCT_EXPORT_MODULE(), the module name available in JS
 *  @param kernel_service_class if specified, your module will be passed an unversioned instance of this kernel service at runtime.
 *         e.g. MyKernelService -> an instance of ABI29_0_0EXMyKernelService
 */
#define ABI29_0_0EX_EXPORT_SCOPED_MODULE(js_name, kernel_service_class) \
ABI29_0_0RCT_EXTERN void ABI29_0_0EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { ABI29_0_0EXRegisterScopedModule(self, @#kernel_service_class, nil); }

/**
 *  Use this in place of ABI29_0_0EX_EXPORT_SCOPED_MODULE() if the module requires more than one kernel service.
 *  @param js_name same as ABI29_0_0RCT_EXPORT_MODULE(), the module name available in JS
 *  @param ... strings representing names of kernel services to be passed to th emodule at runtime.
 *         e.g. @"MyKernelService" -> an instance of ABI29_0_0EXMyKernelService
 */
#define ABI29_0_0EX_EXPORT_SCOPED_MULTISERVICE_MODULE(js_name, ...) \
ABI29_0_0RCT_EXTERN void ABI29_0_0EXRegisterScopedModule(Class, ...); \
+ (NSString *)moduleName { return @#js_name; } \
+ (void)load { ABI29_0_0EXRegisterScopedModule(self, __VA_ARGS__, nil); }

/**
 *  Provides a namespace/bottleneck through which scoped modules
 *  can make themselves accessible to other modules.
 *
 *  e.g. ABI29_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI29_0_0EXCoolClass, coolClass)
 *  provides the getter `_bridge.scopedModules.coolClass`.
 */
#define ABI29_0_0EX_DECLARE_SCOPED_MODULE_GETTER(className, getter) \
@interface ABI29_0_0EXScopedModuleRegistry (className) \
@property (nonatomic, readonly) className *getter; \
@end\

/**
 *  Use in conjunction with ABI29_0_0EX_DECLARE_SCOPED_MODULE_GETTER, but in the corresponding implementation file.
 */
#define ABI29_0_0EX_DEFINE_SCOPED_MODULE_GETTER(className, getter) \
@implementation  ABI29_0_0EXScopedModuleRegistry (className) \
- (className *)getter { return [self.bridge moduleForClass:[className class]]; } \
@end\

@interface ABI29_0_0EXScopedModuleRegistry : NSObject <ABI29_0_0RCTBridgeModule>

@end

@interface ABI29_0_0RCTBridge (ABI29_0_0EXScopedModuleRegistry)

@property (nonatomic, readonly) ABI29_0_0EXScopedModuleRegistry *scopedModules;

@end
