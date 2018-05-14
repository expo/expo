// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <EXCore/EXModule.h>

// Escape hatch for modules that both have to depend on React Native
// and want to be exported as an internal Expo module.
#define EX_RCT_REGISTER_MODULE(jsName, internalName) \
  _EX_REGISTER_MODULE(jsName, internalName, \
    RCT_EXTERN void RCTRegisterModule(Class); \
    RCTRegisterModule(self); \
  )

@protocol EXBridgeModule <RCTBridgeModule>

@optional

- (void)setBridge:(RCTBridge *)bridge;

@end
