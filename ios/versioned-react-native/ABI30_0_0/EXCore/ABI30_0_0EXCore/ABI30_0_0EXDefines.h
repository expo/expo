// Copyright © 2018 650 Industries. All rights reserved.

#define ABI30_0_0EX_EXPORTED_METHODS_PREFIX __ex_export__
#define ABI30_0_0EX_PROPSETTERS_PREFIX __ex_set__

#define ABI30_0_0EX_DO_CONCAT(A, B) A ## B
#define ABI30_0_0EX_CONCAT(A, B) ABI30_0_0EX_DO_CONCAT(A, B)

#define ABI30_0_0EX_EXPORT_METHOD_AS(external_name, method) \
  _EX_EXTERN_METHOD(external_name, method) \
  - (void)method

#define _EX_EXTERN_METHOD(external_name, method) \
  + (const ABI30_0_0EXMethodInfo *)ABI30_0_0EX_CONCAT(ABI30_0_0EX_EXPORTED_METHODS_PREFIX, ABI30_0_0EX_CONCAT(external_name, ABI30_0_0EX_CONCAT(__LINE__, __COUNTER__))) { \
  static ABI30_0_0EXMethodInfo config = {#external_name, #method}; \
  return &config; \
  }

#define ABI30_0_0EX_VIEW_PROPERTY(external_name, type, viewClass) \
  - (void)ABI30_0_0EX_CONCAT(ABI30_0_0EX_PROPSETTERS_PREFIX, external_name):(type)value view:(viewClass *)view

#define _EX_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  extern void ABI30_0_0EXRegisterModule(Class); \
  + (void)load { \
    ABI30_0_0EXRegisterModule(self); \
    _custom_load_code \
  }

#define ABI30_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, _custom_load_code) \
  _EX_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  + (const NSString *)exportedModuleName { return @#external_name; }

#define ABI30_0_0EX_EXPORT_MODULE(external_name) \
  ABI30_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name,)

#define ABI30_0_0EX_REGISTER_MODULE(_custom_load_code) \
  _EX_DEFINE_CUSTOM_LOAD(_custom_load_code)

#define ABI30_0_0EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD(singleton_name, _custom_load_code) \
  extern void ABI30_0_0EXRegisterSingletonModule(Class); \
  + (const NSString *)name { \
    return @#singleton_name; \
  } \
  \
  + (void)load { \
    ABI30_0_0EXRegisterSingletonModule(self); \
    _custom_load_code \
  }

#define ABI30_0_0EX_REGISTER_SINGLETON_MODULE(singleton_name) \
  ABI30_0_0EX_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD(singleton_name,)

#define ABI30_0_0EX_WEAKIFY(var) \
__weak typeof(var) ABI30_0_0EXWeak_##var = var;

#define ABI30_0_0EX_STRONGIFY(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong typeof(var) var = ABI30_0_0EXWeak_##var; \
_Pragma("clang diagnostic pop")

#define ABI30_0_0EX_ENSURE_STRONGIFY(var) \
ABI30_0_0EX_STRONGIFY(var); \
if (var == nil) { return; }

// Converts nil -> [NSNull null]
#define ABI30_0_0EXNullIfNil(value) (value ?: [NSNull null])

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef struct ABI30_0_0EXMethodInfo {
  const char *const jsName;
  const char *const objcName;
} ABI30_0_0EXMethodInfo;

typedef struct ABI30_0_0EXModuleInfo {
  const char *const jsName;
  const char *const internalName;
} ABI30_0_0EXModuleInfo;

typedef void (^ABI30_0_0EXDirectEventBlock)(NSDictionary *body);
typedef void (^ABI30_0_0EXPromiseResolveBlock)(id result);
typedef void (^ABI30_0_0EXPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

#pragma mark - Externs

// These should be defined by the concrete platform adapter
extern void ABI30_0_0EXLogInfo(NSString *format, ...);
extern void ABI30_0_0EXLogWarn(NSString *format, ...);
extern void ABI30_0_0EXLogError(NSString *format, ...);
extern void ABI30_0_0EXFatal(NSError *);
extern NSError * ABI30_0_0EXErrorWithMessage(NSString *);
extern UIApplication *ABI30_0_0EXSharedApplication(void);
