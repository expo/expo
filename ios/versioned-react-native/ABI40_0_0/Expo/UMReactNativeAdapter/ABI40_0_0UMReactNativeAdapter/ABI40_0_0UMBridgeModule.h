// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ABI40_0_0React Native
// and want to be exported as an internal universal module.
#define ABI40_0_0UM_ABI40_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI40_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI40_0_0RCT_EXTERN void ABI40_0_0RCTRegisterModule(Class); \
    ABI40_0_0RCTRegisterModule(self); \
  )

@protocol ABI40_0_0UMBridgeModule <ABI40_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI40_0_0RCTBridge *)bridge;

@end
