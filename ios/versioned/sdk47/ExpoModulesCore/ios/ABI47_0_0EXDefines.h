// Copyright © 2018 650 Industries. All rights reserved.

#if defined(__cplusplus)
#define ABI47_0_0EX_EXTERN extern "C" __attribute__((visibility("default")))
#define ABI47_0_0EX_EXTERN_C_BEGIN extern "C" {
#define ABI47_0_0EX_EXTERN_C_END }
#else
#define ABI47_0_0EX_EXTERN extern __attribute__((visibility("default")))
#define ABI47_0_0EX_EXTERN_C_BEGIN
#define ABI47_0_0EX_EXTERN_C_END
#endif

ABI47_0_0EX_EXTERN_C_BEGIN

#define ABI47_0_0EX_EXPORTED_METHODS_PREFIX __ex_export__
#define ABI47_0_0EX_PROPSETTERS_PREFIX __ex_set__

#define ABI47_0_0EX_DO_CONCAT(A, B) A ## B
#define ABI47_0_0EX_CONCAT(A, B) ABI47_0_0EX_DO_CONCAT(A, B)

#define ABI47_0_0EX_EXPORT_METHOD_AS(external_name, method) \
  _EX_EXTERN_METHOD(external_name, method) \
  - (void)method

#define _EX_EXTERN_METHOD(external_name, method) \
  + (const ABI47_0_0EXMethodInfo *)ABI47_0_0EX_CONCAT(ABI47_0_0EX_EXPORTED_METHODS_PREFIX, ABI47_0_0EX_CONCAT(external_name, ABI47_0_0EX_CONCAT(__LINE__, __COUNTER__))) { \
  static ABI47_0_0EXMethodInfo config = {#external_name, #method}; \
  return &config; \
  }

#define ABI47_0_0EX_VIEW_PROPERTY(external_name, type, viewClass) \
  - (void)ABI47_0_0EX_CONCAT(ABI47_0_0EX_PROPSETTERS_PREFIX, external_name):(type)value view:(viewClass *)view

#define _EX_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  ABI47_0_0EX_EXTERN void ABI47_0_0EXRegisterModule(Class); \
  + (void)load { \
    ABI47_0_0EXRegisterModule(self); \
    _custom_load_code \
  }

#define ABI47_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, _custom_load_code) \
  _EX_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  + (const NSString *)exportedModuleName { return @#external_name; }

#define ABI47_0_0EX_EXPORT_MODULE(external_name) \
  ABI47_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name,)

#define ABI47_0_0EX_REGISTER_MODULE(_custom_load_code) \
  _EX_DEFINE_CUSTOM_LOAD(_custom_load_code)

#define ABI47_0_0EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD(singleton_name, _custom_load_code) \
  ABI47_0_0EX_EXTERN void ABI47_0_0EXRegisterSingletonModule(Class); \
  + (const NSString *)name { \
    return @#singleton_name; \
  } \
  \
  + (void)load { \
    ABI47_0_0EXRegisterSingletonModule(self); \
    _custom_load_code \
  }

#define ABI47_0_0EX_REGISTER_SINGLETON_MODULE(singleton_name) \
  ABI47_0_0EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD(singleton_name,)

#define ABI47_0_0EX_WEAKIFY(var) \
__weak __typeof(var) ABI47_0_0EXWeak_##var = var;

#define ABI47_0_0EX_STRONGIFY(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong __typeof(var) var = ABI47_0_0EXWeak_##var; \
_Pragma("clang diagnostic pop")

#define ABI47_0_0EX_ENSURE_STRONGIFY(var) \
ABI47_0_0EX_STRONGIFY(var); \
if (var == nil) { return; }

// Converts nil -> [NSNull null]
#define ABI47_0_0EXNullIfNil(value) (value ?: [NSNull null])

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef struct ABI47_0_0EXMethodInfo {
  const char *const jsName;
  const char *const objcName;
} ABI47_0_0EXMethodInfo;

typedef struct ABI47_0_0EXModuleInfo {
  const char *const jsName;
  const char *const internalName;
} ABI47_0_0EXModuleInfo;

typedef void (^ABI47_0_0EXDirectEventBlock)(NSDictionary *body);
typedef void (^ABI47_0_0EXPromiseResolveBlock)(id result);
typedef void (^ABI47_0_0EXPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

#pragma mark - Externs

// These should be defined by the concrete platform adapter
ABI47_0_0EX_EXTERN void ABI47_0_0EXLogInfo(NSString *format, ...);
ABI47_0_0EX_EXTERN void ABI47_0_0EXLogWarn(NSString *format, ...);
ABI47_0_0EX_EXTERN void ABI47_0_0EXLogError(NSString *format, ...);
ABI47_0_0EX_EXTERN void ABI47_0_0EXFatal(NSError *);
ABI47_0_0EX_EXTERN NSError * ABI47_0_0EXErrorWithMessage(NSString *);
ABI47_0_0EX_EXTERN UIApplication *ABI47_0_0EXSharedApplication(void);

ABI47_0_0EX_EXTERN_C_END
