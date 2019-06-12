// Copyright 2019-present 650 Industries. All rights reserved.

// NOTE: This entire file should be codegen'ed, but wasn't

#import <vector>

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

#ifdef RN_TURBO_MODULE_ENABLED
#import <jsireact/RCTTurboModule.h>
#endif

@protocol UMNativeModulesProxySpec <
  RCTBridgeModule
#ifdef RN_TURBO_MODULE_ENABLED
  ,
  RCTTurboModule
#endif
>

- (void)callMethod:(NSString *)moduleName methodNameOrKey:(id)methodNameOrKey arguments:(NSArray *)arguments resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;
- (NSDictionary *)constantsToExport;
- (NSDictionary *)getConstants;

@end

#ifdef RN_TURBO_MODULE_ENABLED

namespace facebook {
  namespace react {

    /**
     * The iOS TurboModule impl specific to SampleTurboModule.
     */
    class JSI_EXPORT UMNativeModulesProxySpecJSI : public ObjCTurboModule {
    public:
      UMNativeModulesProxySpecJSI(id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);
    };

  } // namespace react
} // namespace facebook

#endif
