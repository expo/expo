// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on ReactABI34_0_0 Native
// and want to be exported as an internal universal module.
#define ABI34_0_0UM_ABI34_0_0RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  ABI34_0_0UM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    ABI34_0_0RCT_EXTERN void ABI34_0_0RCTRegisterModule(Class); \
    ABI34_0_0RCTRegisterModule(self); \
  )

@protocol ABI34_0_0UMBridgeModule <ABI34_0_0RCTBridgeModule>

@optional

- (void)setBridge:(ABI34_0_0RCTBridge *)bridge;

@end
