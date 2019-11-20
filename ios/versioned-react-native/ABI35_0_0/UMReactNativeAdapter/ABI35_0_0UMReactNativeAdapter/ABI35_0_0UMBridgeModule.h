// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ReactABI35_0_0 Native
// and want to be exported as an internal universal module.
#define ABI35_0_0UM_ABI35_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI35_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI35_0_0RCT_EXTERN void ABI35_0_0RCTRegisterModule(Class); \
    ABI35_0_0RCTRegisterModule(self); \
  )

@protocol ABI35_0_0UMBridgeModule <ABI35_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI35_0_0RCTBridge *)bridge;

@end
