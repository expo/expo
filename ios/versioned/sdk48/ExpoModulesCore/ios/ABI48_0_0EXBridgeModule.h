// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ABI48_0_0React Native
// and want to be exported as an internal universal module.
#define ABI48_0_0EX_RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI48_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI48_0_0RCT_EXTERN void ABI48_0_0RCTRegisterModule(Class); \
    ABI48_0_0RCTRegisterModule(self); \
  )

@protocol ABI48_0_0EXBridgeModule <ABI48_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI48_0_0RCTBridge *)bridge;

@end
