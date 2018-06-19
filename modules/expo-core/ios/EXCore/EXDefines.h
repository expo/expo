// Copyright © 2018 650 Industries. All rights reserved.

#define EX_EXPORTED_METHODS_PREFIX __ex_export__
#define EX_PROPSETTERS_PREFIX __ex_set__

#define EX_DO_CONCAT(A, B) A ## B
#define EX_CONCAT(A, B) EX_DO_CONCAT(A, B)

#define EX_EXPORT_METHOD_AS(external_name, method) \
  _EX_EXTERN_METHOD(external_name, method) \
  - (void)method

#define _EX_EXTERN_METHOD(external_name, method) \
  + (const EXMethodInfo *)EX_CONCAT(EX_EXPORTED_METHODS_PREFIX, EX_CONCAT(external_name, EX_CONCAT(__LINE__, __COUNTER__))) { \
  static EXMethodInfo config = {#external_name, #method}; \
  return &config; \
  }

#define EX_VIEW_PROPERTY(external_name, type, viewClass) \
  - (void)EX_CONCAT(EX_PROPSETTERS_PREFIX, external_name):(type)value view:(viewClass *)view

#define _EX_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  extern void EXRegisterModule(Class); \
  + (void)load { \
    EXRegisterModule(self); \
    _custom_load_code \
  }

#define EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, _custom_load_code) \
  _EX_DEFINE_CUSTOM_LOAD(_custom_load_code) \
  + (const NSString *)exportedModuleName { return @#external_name; }

#define EX_EXPORT_MODULE(external_name) \
  EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name,)

#define EX_REGISTER_MODULE(_custom_load_code) \
  _EX_DEFINE_CUSTOM_LOAD(_custom_load_code)

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef struct EXMethodInfo {
  const char *const jsName;
  const char *const objcName;
} EXMethodInfo;

typedef struct EXModuleInfo {
  const char *const jsName;
  const char *const internalName;
} EXModuleInfo;

typedef void (^EXDirectEventBlock)(NSDictionary *body);
typedef void (^EXPromiseResolveBlock)(id result);
typedef void (^EXPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

#pragma mark - Externs

// These should be defined by the concrete platform adapter
extern void EXLogInfo(NSString *format, ...);
extern void EXLogWarn(NSString *format, ...);
extern void EXLogError(NSString *format, ...);
extern void EXFatal(NSError *);
extern NSError * EXErrorWithMessage(NSString *);
extern UIApplication *EXSharedApplication(void);
