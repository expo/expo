// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

// Escape hatch for modules that both have to depend on React Native
// and want to be exported as an internal universal module.
#define UM_RCT_REGISTER_MODULE(external_name) \
  + (const NSString *)moduleName { return @#external_name; } \
  UM_EXPORT_MODULE_WITH_CUSTOM_LOAD(external_name, \
    RCT_EXTERN void RCTRegisterModule(Class); \
    RCTRegisterModule(self); \
  )

@protocol UMBridgeModule <RCTBridgeModule>

@optional

- (void)setBridge:(RCTBridge *)bridge;

@end
