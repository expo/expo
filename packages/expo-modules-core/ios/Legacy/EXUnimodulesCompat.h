// Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXDefines.h>

#define UM_DEPRECATED(type_name) __deprecated_msg("use EX"#type_name" from ExpoModulesCore instead")

#define UM_EXPORTED_METHODS_PREFIX EX_EXPORTED_METHODS_PREFIX
#define UM_PROPSETTERS_PREFIX EX_PROPSETTERS_PREFIX

#define UM_DO_CONCAT EX_DO_CONCAT
#define UM_CONCAT EX_CONCAT

#define UM_EXPORT_METHOD_AS EX_EXPORT_METHOD_AS

#define _UM_EXTERN_METHOD _EX_EXTERN_METHOD

#define UM_VIEW_PROPERTY EX_VIEW_PROPERTY

#define _UM_DEFINE_CUSTOM_LOAD _EX_DEFINE_CUSTOM_LOAD

#define UM_EXPORT_MODULE_WITH_CUSTOM_LOAD EX_EXPORT_MODULE_WITH_CUSTOM_LOAD

#define UM_EXPORT_MODULE EX_EXPORT_MODULE

#define UM_REGISTER_MODULE EX_REGISTER_MODULE

#define UM_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD

#define UM_REGISTER_SINGLETON_MODULE EX_REGISTER_SINGLETON_MODULE

// Weakify/Strongify need to be defined from scratch because of a reference to `UMWeak`
#define UM_WEAKIFY(var) \
__weak __typeof(var) UMWeak_##var = var;

#define UM_STRONGIFY(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong __typeof(var) var = UMWeak_##var; \
_Pragma("clang diagnostic pop")

#define UM_ENSURE_STRONGIFY(var) \
UM_STRONGIFY(var); \
if (var == nil) { return; }

// Converts nil -> [NSNull null]
#define UMNullIfNil EXNullIfNil

#define UMMethodInfo EXMethodInfo
#define UMModuleInfo EXModuleInfo

#define UMDirectEventBlock EXDirectEventBlock
#define UMPromiseResolveBlock EXPromiseResolveBlock
#define UMPromiseRejectBlock EXPromiseRejectBlock

// These should be defined by the concrete platform adapter
#define UMLogInfo EXLogInfo
#define UMLogWarn EXLogWarn
#define UMLogError EXLogError
#define UMFatal EXFatal
#define UMErrorWithMessage EXErrorWithMessage
#define UMSharedApplication EXSharedApplication
