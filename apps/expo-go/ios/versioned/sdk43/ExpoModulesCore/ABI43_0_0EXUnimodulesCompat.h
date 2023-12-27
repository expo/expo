// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>

#define ABI43_0_0UM_DEPRECATED(type_name) __deprecated_msg("use ABI43_0_0EX"#type_name" from ExpoModulesCore instead")

#define ABI43_0_0UM_EXPORTED_METHODS_PREFIX ABI43_0_0EX_EXPORTED_METHODS_PREFIX
#define ABI43_0_0UM_PROPSETTERS_PREFIX ABI43_0_0EX_PROPSETTERS_PREFIX

#define ABI43_0_0UM_DO_CONCAT ABI43_0_0EX_DO_CONCAT
#define ABI43_0_0UM_CONCAT ABI43_0_0EX_CONCAT

#define ABI43_0_0UM_EXPORT_METHOD_AS ABI43_0_0EX_EXPORT_METHOD_AS

#define _UM_EXTERN_METHOD _EX_EXTERN_METHOD

#define ABI43_0_0UM_VIEW_PROPERTY ABI43_0_0EX_VIEW_PROPERTY

#define _UM_DEFINE_CUSTOM_LOAD _EX_DEFINE_CUSTOM_LOAD

#define ABI43_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD ABI43_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD

#define ABI43_0_0UM_EXPORT_MODULE ABI43_0_0EX_EXPORT_MODULE

#define ABI43_0_0UM_REGISTER_MODULE ABI43_0_0EX_REGISTER_MODULE

#define ABI43_0_0UM_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD ABI43_0_0EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD

#define ABI43_0_0UM_REGISTER_SINGLETON_MODULE ABI43_0_0EX_REGISTER_SINGLETON_MODULE

// Weakify/Strongify need to be defined from scratch because of a reference to `ABI43_0_0UMWeak`
#define ABI43_0_0UM_WEAKIFY(var) \
__weak __typeof(var) ABI43_0_0UMWeak_##var = var;

#define ABI43_0_0UM_STRONGIFY(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong __typeof(var) var = ABI43_0_0UMWeak_##var; \
_Pragma("clang diagnostic pop")

#define ABI43_0_0UM_ENSURE_STRONGIFY(var) \
ABI43_0_0UM_STRONGIFY(var); \
if (var == nil) { return; }

// Converts nil -> [NSNull null]
#define ABI43_0_0UMNullIfNil ABI43_0_0EXNullIfNil

#define ABI43_0_0UMMethodInfo ABI43_0_0EXMethodInfo
#define ABI43_0_0UMModuleInfo ABI43_0_0EXModuleInfo

#define ABI43_0_0UMDirectEventBlock ABI43_0_0EXDirectEventBlock
#define ABI43_0_0UMPromiseResolveBlock ABI43_0_0EXPromiseResolveBlock
#define ABI43_0_0UMPromiseRejectBlock ABI43_0_0EXPromiseRejectBlock

// These should be defined by the concrete platform adapter
#define ABI43_0_0UMLogInfo ABI43_0_0EXLogInfo
#define ABI43_0_0UMLogWarn ABI43_0_0EXLogWarn
#define ABI43_0_0UMLogError ABI43_0_0EXLogError
#define ABI43_0_0UMFatal ABI43_0_0EXFatal
#define ABI43_0_0UMErrorWithMessage ABI43_0_0EXErrorWithMessage
#define ABI43_0_0UMSharedApplication ABI43_0_0EXSharedApplication
