// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ABI45_0_0React Native
// and want to be exported as an internal universal module.
#define ABI45_0_0EX_RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI45_0_0EX_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI45_0_0RCT_EXTERN void ABI45_0_0RCTRegisterModule(Class); \
    ABI45_0_0RCTRegisterModule(self); \
  )

@protocol ABI45_0_0EXBridgeModule <ABI45_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge;

@end
