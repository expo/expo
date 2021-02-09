// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ABI38_0_0React Native
// and want to be exported as an internal universal module.
#define ABI38_0_0UM_ABI38_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI38_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI38_0_0RCT_EXTERN void ABI38_0_0RCTRegisterModule(Class); \
    ABI38_0_0RCTRegisterModule(self); \
  )

@protocol ABI38_0_0UMBridgeModule <ABI38_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI38_0_0RCTBridge *)bridge;

@end
