// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ReactABI31_0_0 Native
// and want to be exported as an internal Expo module.
#define ABI31_0_0EX_ABI31_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI31_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI31_0_0RCT_EXTERN void ABI31_0_0RCTRegisterModule(Class); \
    ABI31_0_0RCTRegisterModule(self); \
  )

@protocol ABI31_0_0EXBridgeModule <ABI31_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI31_0_0RCTBridge *)bridge;

@end
