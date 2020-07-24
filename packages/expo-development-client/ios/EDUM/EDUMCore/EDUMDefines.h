// Copyright © 2018 650 Industries. All rights reserved.

#define EDUM_EXPORTED_METHODS_PREFIX __um_export__
#define EDUM_PROPSETTERS_PREFIX __um_set__

#define EDUM_DO_CONCAT(A, B) A ## B
#define EDUM_CONCAT(A, B) EDUM_DO_CONCAT(A, B)

#define EDUM_EXPORT_METHOD_AS(external_name, method) \
  _UM_EXTERN_METHOD(external_name, method) \
  - (void)method

#define _UM_EXTERN_METHOD(external_name, method) \
  + (const EDUMMethodInfo *)EDUM_CONCAT(EDUM_EXPORTED_METHODS_PREFIX, EDUM_CONCAT(external_name, EDUM_CONCAT(__LINE__, __COUNTER__))) { \
  static EDUMMethodInfo config = {#external_name, #method}; \
  return &config; \
  }

#define EDUM_VIEW_PROPERTY(external_name, type, viewClass) \
  - (void)EDUM_CONCAT(EDUM_PROPSETTERS_PREFIX, external_name):(type)value view:(viewClass *)view

#define _UM_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  extern void EDUMRegisterModule(Class); \
  + (void)load { \
    EDUMRegisterModule(self); \
    _custom_load_code \
  }

#define EDUM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, _custom_load_code) \
  _UM_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  + (const NSString *)exportedModuleName { return @#external_name; }

#define EDUM_EXPORT_MODULE(external_name) \
  EDUM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name,)

#define EDUM_REGISTER_MODULE(_custom_load_code) \
  _UM_DEFINE_CUSTOM_LOAD(_custom_load_code)

#define EDUM_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD(singleton_name, _custom_load_code) \
  extern void EDUMRegisterSingletonModule(Class); \
  + (const NSString *)name { \
    return @#singleton_name; \
  } \
  \
  + (void)load { \
    EDUMRegisterSingletonModule(self); \
    _custom_load_code \
  }

#define EDUM_REGISTER_SINGLETON_MODULE(singleton_name) \
  EDUM_REGISTER_SINGLETON_MODULE_WITH_CUSTOM_LOAD(singleton_name,)

#define EDUM_WEAKIFY(var) \
__weak typeof(var) EDUMWeak_##var = var;

#define EDUM_STRONGIFY(var) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
__strong typeof(var) var = EDUMWeak_##var; \
_Pragma("clang diagnostic pop")

#define EDUM_ENSURE_STRONGIFY(var) \
EDUM_STRONGIFY(var); \
if (var == nil) { return; }

// Converts nil -> [NSNull null]
#define EDUMNullIfNil(value) (value ?: [NSNull null])

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef struct EDUMMethodInfo {
  const char *const jsName;
  const char *const objcName;
} EDUMMethodInfo;

typedef struct EDUMModuleInfo {
  const char *const jsName;
  const char *const internalName;
} EDUMModuleInfo;

typedef void (^EDUMDirectEventBlock)(NSDictionary *body);
typedef void (^EDUMPromiseResolveBlock)(id result);
typedef void (^EDUMPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

#pragma mark - Externs

// These should be defined by the concrete platform adapter
extern void EDUMLogInfo(NSString *format, ...);
extern void EDUMLogWarn(NSString *format, ...);
extern void EDUMLogError(NSString *format, ...);
extern void EDUMFatal(NSError *);
extern NSError * EDUMErrorWithMessage(NSString *);
extern UIApplication *EDUMSharedApplication(void);
