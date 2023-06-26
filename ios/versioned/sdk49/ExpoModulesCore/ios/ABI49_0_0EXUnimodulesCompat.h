// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXDefines.h>

#define ABI49_0_0UM_DEPRECATED(type_name) __deprecated_msg("use ABI49_0_0EX"#type_name" from ExpoModulesCore instead")

#define ABI49_0_0UM_EXPORTED_METHODS_PREFIX ABI49_0_0EX_EXPORTED_METHODS_PREFIX
#define ABI49_0_0UM_PROPSETTERS_PREFIX ABI49_0_0EX_PROPSETTERS_PREFIX

#define ABI49_0_0UM_DO_CONCAT ABI49_0_0EX_DO_CONCAT
#define ABI49_0_0UM_CONCAT ABI49_0_0EX_CONCAT

#define ABI49_0_0UM_EXPORT_METHOD_AS ABI49_0_0EX_EXPORT_METHOD_AS

#define _UM_EXTERN_METHOD _EX_EXTERN_METHOD

#define ABI49_0_0UM_VIEW_PROPERTY ABI49_0_0EX_VIEW_PROPERTY

#define _UM_DEFINE_CUSTOM_LOAD _EX_DEFINE_CUSTOM_LOAD

#define ABI49_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD ABI49_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD

#define ABI49_0_0UM_EXPORT_MODULE ABI49_0_0EX_EXPORT_MODULE

#define ABI49_0_0UM_REGISTER_MODULE ABI49_0_0EX_REGISTER_MODULE

#define ABI49_0_0UM_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD ABI49_0_0EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD

#define ABI49_0_0UM_REGISTER_SINGLETON_MODULE ABI49_0_0EX_REGISTER_SINGLETON_MODULE

// Weakify/Strongify need to be defined from scratch because of a reference to `ABI49_0_0UMWeak`
#define ABI49_0_0UM_WEAKIFY(var) \
__weak __typeof(var) ABI49_0_0UMWeak_##var = var;

#define ABI49_0_0UM_STRONGIFY(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong __typeof(var) var = ABI49_0_0UMWeak_##var; \
_Pragma("clang diagnostic pop")

#define ABI49_0_0UM_ENSURE_STRONGIFY(var) \
ABI49_0_0UM_STRONGIFY(var); \
if (var == nil) { return; }

// Converts nil -> [NSNull null]
#define ABI49_0_0UMNullIfNil ABI49_0_0EXNullIfNil

#define ABI49_0_0UMMethodInfo ABI49_0_0EXMethodInfo
#define ABI49_0_0UMModuleInfo ABI49_0_0EXModuleInfo

#define ABI49_0_0UMDirectEventBlock ABI49_0_0EXDirectEventBlock
#define ABI49_0_0UMPromiseResolveBlock ABI49_0_0EXPromiseResolveBlock
#define ABI49_0_0UMPromiseRejectBlock ABI49_0_0EXPromiseRejectBlock

// These should be defined by the concrete platform adapter
#define ABI49_0_0UMLogInfo ABI49_0_0EXLogInfo
#define ABI49_0_0UMLogWarn ABI49_0_0EXLogWarn
#define ABI49_0_0UMLogError ABI49_0_0EXLogError
#define ABI49_0_0UMFatal ABI49_0_0EXFatal
#define ABI49_0_0UMErrorWithMessage ABI49_0_0EXErrorWithMessage
#define ABI49_0_0UMSharedApplication ABI49_0_0EXSharedApplication
