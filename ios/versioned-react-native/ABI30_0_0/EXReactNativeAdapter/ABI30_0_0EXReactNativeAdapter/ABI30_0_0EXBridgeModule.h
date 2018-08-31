// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ReactABI30_0_0 Native
// and want to be exported as an internal Expo module.
#define ABI30_0_0EX_ABI30_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI30_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI30_0_0RCT_EXTERN void ABI30_0_0RCTRegisterModule(Class); \
    ABI30_0_0RCTRegisterModule(self); \
  )

@protocol ABI30_0_0EXBridgeModule <ABI30_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge;

@end
