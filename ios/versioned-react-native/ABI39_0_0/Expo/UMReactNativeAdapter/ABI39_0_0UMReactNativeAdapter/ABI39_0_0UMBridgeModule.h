// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ABI39_0_0React Native
// and want to be exported as an internal universal module.
#define ABI39_0_0UM_ABI39_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI39_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI39_0_0RCT_EXTERN void ABI39_0_0RCTRegisterModule(Class); \
    ABI39_0_0RCTRegisterModule(self); \
  )

@protocol ABI39_0_0UMBridgeModule <ABI39_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI39_0_0RCTBridge *)bridge;

@end
