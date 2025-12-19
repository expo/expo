// Stub implementation of module registration functions for SPM prebuild
// These are normally defined in EXModuleRegistryProvider.m but that file has complex dependencies
// The actual module registration happens at runtime in the app, not in the prebuild

#import <Foundation/Foundation.h>

#ifdef __cplusplus
extern "C" {
#endif

void EXRegisterModule(Class moduleClass) {
  // No-op stub - module registration happens at app runtime, not in the framework
}

void EXRegisterSingletonModule(Class singletonModuleClass) {
  // No-op stub - singleton module registration happens at app runtime
}

#ifdef __cplusplus
}
#endif

// Stub logging functions - EXLogManager is excluded due to EXModuleRegistryProvider dependencies
void EXLogInfo(NSString *format, ...) {
  // No-op stub
}

void EXLogWarn(NSString *format, ...) {
  // No-op stub
}

void EXLogError(NSString *format, ...) {
  // No-op stub
}
