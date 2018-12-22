// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ReactABI32_0_0 Native
// and want to be exported as an internal Expo module.
#define ABI32_0_0EX_ABI32_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI32_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI32_0_0RCT_EXTERN void ABI32_0_0RCTRegisterModule(Class); \
    ABI32_0_0RCTRegisterModule(self); \
  )

@protocol ABI32_0_0EXBridgeModule <ABI32_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI32_0_0RCTBridge *)bridge;

@end
