// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>

#define ABI46_0_0UM_DEPRECATED(type_name) __deprecated_msg("use ABI46_0_0EX"#type_name" from ExpoModulesCore instead")

#define ABI46_0_0UM_EXPORTED_METHODS_PREFIX ABI46_0_0EX_EXPORTED_METHODS_PREFIX
#define ABI46_0_0UM_PROPSETTERS_PREFIX ABI46_0_0EX_PROPSETTERS_PREFIX

#define ABI46_0_0UM_DO_CONCAT ABI46_0_0EX_DO_CONCAT
#define ABI46_0_0UM_CONCAT ABI46_0_0EX_CONCAT

#define ABI46_0_0UM_EXPORT_METHOD_AS ABI46_0_0EX_EXPORT_METHOD_AS

#define _UM_EXTERN_METHOD _EX_EXTERN_METHOD

#define ABI46_0_0UM_VIEW_PROPERTY ABI46_0_0EX_VIEW_PROPERTY

#define _UM_DEFINE_CUSTOM_LOAD _EX_DEFINE_CUSTOM_LOAD

#define ABI46_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD ABI46_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD

#define ABI46_0_0UM_EXPORT_MODULE ABI46_0_0EX_EXPORT_MODULE

#define ABI46_0_0UM_REGISTER_MODULE ABI46_0_0EX_REGISTER_MODULE

#define ABI46_0_0UM_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD ABI46_0_0EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD

#define ABI46_0_0UM_REGISTER_SINGLETON_MODULE ABI46_0_0EX_REGISTER_SINGLETON_MODULE

// Weakify/Strongify need to be defined from scratch because of a reference to `ABI46_0_0UMWeak`
#define ABI46_0_0UM_WEAKIFY(var) \
__weak __typeof(var) ABI46_0_0UMWeak_##var = var;

#define ABI46_0_0UM_STRONGIFY(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong __typeof(var) var = ABI46_0_0UMWeak_##var; \
_Pragma("clang diagnostic pop")

#define ABI46_0_0UM_ENSURE_STRONGIFY(var) \
ABI46_0_0UM_STRONGIFY(var); \
if (var == nil) { return; }

// Converts nil -> [NSNull null]
#define ABI46_0_0UMNullIfNil ABI46_0_0EXNullIfNil

#define ABI46_0_0UMMethodInfo ABI46_0_0EXMethodInfo
#define ABI46_0_0UMModuleInfo ABI46_0_0EXModuleInfo

#define ABI46_0_0UMDirectEventBlock ABI46_0_0EXDirectEventBlock
#define ABI46_0_0UMPromiseResolveBlock ABI46_0_0EXPromiseResolveBlock
#define ABI46_0_0UMPromiseRejectBlock ABI46_0_0EXPromiseRejectBlock

// These should be defined by the concrete platform adapter
#define ABI46_0_0UMLogInfo ABI46_0_0EXLogInfo
#define ABI46_0_0UMLogWarn ABI46_0_0EXLogWarn
#define ABI46_0_0UMLogError ABI46_0_0EXLogError
#define ABI46_0_0UMFatal ABI46_0_0EXFatal
#define ABI46_0_0UMErrorWithMessage ABI46_0_0EXErrorWithMessage
#define ABI46_0_0UMSharedApplication ABI46_0_0EXSharedApplication
